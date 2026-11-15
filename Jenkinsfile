pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend lint and production build') {
            steps {
                sh '''
                    set -eu
                    node --version
                    npm --version
                    npm ci --prefix client
                    npm run lint --prefix client
                    npm run build --prefix client
                '''
            }
        }

        stage('Backend tests') {
            steps {
                sh '''
                    set -eu
                    npm ci --prefix server
                    npm test --prefix server
                '''
            }
        }

        stage('Build and tag Docker images') {
            steps {
                sh '''
                    set -eu
                    docker build --pull \
                        --file client/Dockerfile \
                        --tag revendo-frontend:${BUILD_NUMBER} \
                        --tag revendo-frontend:latest \
                        client
                    docker build --pull \
                        --file server/Dockerfile \
                        --tag revendo-backend:${BUILD_NUMBER} \
                        --tag revendo-backend:latest \
                        server
                    docker image inspect \
                        revendo-frontend:${BUILD_NUMBER} \
                        revendo-frontend:latest \
                        revendo-backend:${BUILD_NUMBER} \
                        revendo-backend:latest >/dev/null
                '''
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'revendo-dockerhub',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    script {
                        def namespace = (env.DOCKERHUB_NAMESPACE ?: env.DOCKERHUB_USERNAME)
                            .trim()
                            .toLowerCase()
                        if (!(namespace ==~ /[a-z0-9]+(?:[._-][a-z0-9]+)*/)) {
                            error('Set DOCKERHUB_NAMESPACE to a valid Docker Hub username or organization.')
                        }
                        env.DOCKERHUB_IMAGE_NAMESPACE = namespace
                    }
                    sh '''
                        set +x
                        set -eu

                        docker_config="$(mktemp -d)"
                        export DOCKER_CONFIG="$docker_config"
                        cleanup() {
                            docker logout >/dev/null 2>&1 || true
                            rm -rf -- "$docker_config"
                        }
                        trap cleanup EXIT

                        printf '%s' "$DOCKERHUB_TOKEN" |
                            docker login --username "$DOCKERHUB_USERNAME" --password-stdin

                        for image in frontend backend; do
                            source_image="revendo-$image"
                            target_image="$DOCKERHUB_IMAGE_NAMESPACE/revendo-$image"
                            docker tag "$source_image:${BUILD_NUMBER}" "$target_image:${BUILD_NUMBER}"
                            docker tag "$source_image:latest" "$target_image:latest"
                            docker push "$target_image:${BUILD_NUMBER}"
                            docker push "$target_image:latest"
                        done
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                if (env.NOTIFICATION_EMAIL?.trim()) {
                    mail(
                        to: env.NOTIFICATION_EMAIL,
                        subject: "[ReVendo] SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: "Build succeeded.\n${env.BUILD_URL}"
                    )
                } else {
                    echo 'NOTIFICATION_EMAIL is not set; skipping success email.'
                }
            }
        }
        failure {
            script {
                if (env.NOTIFICATION_EMAIL?.trim()) {
                    mail(
                        to: env.NOTIFICATION_EMAIL,
                        subject: "[ReVendo] FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: "Build failed. Review the Jenkins console output:\n${env.BUILD_URL}console"
                    )
                } else {
                    echo 'NOTIFICATION_EMAIL is not set; skipping failure email.'
                }
            }
        }
    }
}
