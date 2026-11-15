#!/usr/bin/env bash
set -Eeuo pipefail

fail() {
  printf 'EC2 deployment configuration error: %s\n' "$1" >&2
  exit 1
}

for name in EC2_HOST EC2_USER EC2_SSH_PRIVATE_KEY EC2_KNOWN_HOSTS EC2_DEPLOY_PATH IMAGE_TAG JWT_SECRET MONGO_URI CLIENT_URL; do
  if [[ -z "${!name:-}" ]]; then
    fail "$name is required."
  fi
done

[[ "$EC2_HOST" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || fail 'EC2_HOST must be an IPv4 address or DNS name.'
[[ "$EC2_USER" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]] || fail 'EC2_USER is invalid.'
[[ "$EC2_SSH_PORT" =~ ^[0-9]+$ ]] && (( EC2_SSH_PORT > 0 && EC2_SSH_PORT < 65536 )) || fail 'EC2_SSH_PORT must be between 1 and 65535.'
[[ "$EC2_DEPLOY_PATH" =~ ^/[A-Za-z0-9._/-]+$ && "$EC2_DEPLOY_PATH" != '/' && "$EC2_DEPLOY_PATH" != *'..'* ]] || fail 'EC2_DEPLOY_PATH must be a safe absolute path.'
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || fail 'IMAGE_TAG must be a full Git commit SHA.'
[[ ${#JWT_SECRET} -ge 32 ]] || fail 'PRODUCTION_JWT_SECRET must contain at least 32 characters.'
[[ "$MONGO_URI" == mongodb://* || "$MONGO_URI" == mongodb+srv://* ]] || fail 'PRODUCTION_MONGO_URI must be a MongoDB connection URI.'
[[ "$CLIENT_URL" == https://* ]] || fail 'PRODUCTION_CLIENT_URL must use HTTPS.'
[[ -n "$EC2_KNOWN_HOSTS" ]] || fail 'EC2_KNOWN_HOSTS must contain the verified SSH host key.'

runner_temp="${RUNNER_TEMP:-/tmp}"
ssh_dir="$(mktemp -d "$runner_temp/revendo-ssh.XXXXXX")"
env_file="$runner_temp/revendo-production.env"

cleanup() {
  rm -rf -- "$ssh_dir"
  rm -f -- "$env_file"
}
trap cleanup EXIT

key_file="$ssh_dir/id_ed25519"
known_hosts_file="$ssh_dir/known_hosts"
printf '%s\n' "$EC2_SSH_PRIVATE_KEY" > "$key_file"
printf '%s\n' "$EC2_KNOWN_HOSTS" > "$known_hosts_file"
chmod 600 "$key_file" "$known_hosts_file"

python3 - "$env_file" <<'PY'
import os
import pathlib
import sys

keys = (
    "IMAGE_TAG",
    "JWT_SECRET",
    "MONGO_URI",
    "CLIENT_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "EMAIL_FROM",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
)

def quote(value):
    if "\n" in value or "\r" in value:
        raise SystemExit("Deployment environment values must not contain newlines.")
    return "'" + value.replace("'", "\\'") + "'"

path = pathlib.Path(sys.argv[1])
path.write_text(
    "".join(f"{key}={quote(os.environ.get(key, ''))}\n" for key in keys),
    encoding="utf-8",
)
path.chmod(0o600)
PY

remote="${EC2_USER}@${EC2_HOST}"
ssh_options=(
  -i "$key_file"
  -p "$EC2_SSH_PORT"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$known_hosts_file"
  -o ConnectTimeout=15
)
scp_options=(
  -i "$key_file"
  -P "$EC2_SSH_PORT"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$known_hosts_file"
  -o ConnectTimeout=15
)

ssh "${ssh_options[@]}" "$remote" "mkdir -p -- '$EC2_DEPLOY_PATH' && chmod 700 -- '$EC2_DEPLOY_PATH'"
scp "${scp_options[@]}" "$env_file" "$remote:$EC2_DEPLOY_PATH/.env.next"
scp "${scp_options[@]}" docker-compose.prod.yml "$remote:$EC2_DEPLOY_PATH/docker-compose.prod.yml.next"
ssh "${ssh_options[@]}" "$remote" "chmod 600 '$EC2_DEPLOY_PATH/.env.next' && chmod 644 '$EC2_DEPLOY_PATH/docker-compose.prod.yml.next'"

ssh "${ssh_options[@]}" "$remote" "DEPLOY_PATH='$EC2_DEPLOY_PATH' IMAGE_TAG='$IMAGE_TAG' bash -s" <<'REMOTE'
set -Eeuo pipefail
cd -- "$DEPLOY_PATH"

if [[ -e .env.rollback || -e docker-compose.prod.yml.rollback ]]; then
  printf 'A previous deployment left rollback files; inspect %s before retrying.\n' "$DEPLOY_PATH" >&2
  exit 1
fi

env_backup=0
compose_backup=0
if [[ -f .env ]]; then
  cp -p .env .env.rollback
  env_backup=1
fi
if [[ -f docker-compose.prod.yml ]]; then
  cp -p docker-compose.prod.yml docker-compose.prod.yml.rollback
  compose_backup=1
fi

chmod 600 .env.next
mv .env.next .env
mv docker-compose.prod.yml.next docker-compose.prod.yml
compose=(docker compose --project-name revendo --env-file .env --file docker-compose.prod.yml)

rollback() {
  printf 'Deployment health check failed; restoring the previous release.\n' >&2
  if (( env_backup && compose_backup )); then
    mv .env.rollback .env
    mv docker-compose.prod.yml.rollback docker-compose.prod.yml
    if ! "${compose[@]}" pull || ! "${compose[@]}" up -d --no-build --wait --wait-timeout 180; then
      printf 'Automatic rollback did not become healthy. Manual recovery is required.\n' >&2
      exit 1
    fi
  else
    "${compose[@]}" down --remove-orphans || true
    if (( env_backup )); then
      mv .env.rollback .env
    else
      rm -f .env
    fi
    if (( compose_backup )); then
      mv docker-compose.prod.yml.rollback docker-compose.prod.yml
    else
      rm -f docker-compose.prod.yml
    fi
    printf 'No complete previous release was available for automatic rollback.\n' >&2
  fi
  exit 1
}

if ! "${compose[@]}" pull; then
  rollback
fi
if ! "${compose[@]}" up -d --no-build --wait --wait-timeout 180; then
  rollback
fi
if ! "${compose[@]}" exec -T frontend wget -q -O - http://127.0.0.1:8080/api/health | grep -q '"success":true'; then
  rollback
fi

rm -f .env.rollback docker-compose.prod.yml.rollback
printf 'Release %s is healthy.\n' "$IMAGE_TAG"
REMOTE
