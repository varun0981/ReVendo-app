import { createHash, randomBytes } from 'node:crypto'

export function createOpaqueToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(value) {
  return createHash('sha256').update(value).digest('hex')
}
