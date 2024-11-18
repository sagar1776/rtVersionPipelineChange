pipeline {
    options {
        timeout(time: 1, unit: 'HOURS')
    }

    agent any

    stages {
        stage ('Git Clone')
        {
            steps
            {
                git branch: 'master', credentialsId: 'githubPAT', url: 'https://github.com/sagar1776/rtVersionPipelineChange.git'
                sh 'git log'
            }
        }

        stage('Parsing Version Details') {
            
            steps {
                script{
                    def packageJsonContents = readFile 'test.json'
        
                    // Assign the VISUAL_DEV_RELEASE_VERSION version to a global variable
                    // Using regular expression to extract the value of VISUAL_DEV_RELEASE_VERSION
                    def matcher = ( packageJsonContents =~ /"version":\s*"([^"]+)"/)
                    if (matcher.find()) {
                        env.RELEASE_VERSION = matcher[0][1]
                        echo "Release version: ${env.RELEASE_VERSION}"
                    } else {
                        echo "Could not find version details in package.json"
                    }

                    // Using regular expression to extract the value of WORKBOX_VERSION
                    matcher = ( packageJsonContents =~ /"workbox-build":\s*"([\d.]+)"/)
                    if (matcher.find()) {
                        env.WORKBOX_VERSION = matcher[0][1]
                        echo "Workbox version: ${env.WORKBOX_VERSION}"
                    } else {
                        echo "Could not find workbox-build version in package.json"
                    }
                }
            }
        }
    }
}