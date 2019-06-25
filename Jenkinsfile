#!groovy

/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2018, 2019
 */


node('zowe-dependency-scanning') {

  def DEPENDENCY_SCAN_HOME = "/home/jenkins/dependency-scan"
  def PENDING_APPROVAL_REPORT_NAME = "dependency_approval_action_aggregates.json"
  def MARKDOWN_REPORT_NAME = "markdown_dependency_report.md"

  def lib = library("jenkins-library").org.zowe.jenkins_shared_library

  def pipeline = lib.pipelines.generic.GenericPipeline.new(this)

  pipeline.admins.add("markackert")

  def registry = lib.npm.Registry.new(this);
  registry.init(
      registry: lib.Constants.DEFAULT_NPM_PRIVATE_REGISTRY_INSTALL,
      email: lib.Constants.DEFAULT_NPM_PRIVATE_REGISTRY_EMAIL,
      usernamePasswordCredential: lib.Constants.DEFAULT_NPM_PRIVATE_REGISTRY_CREDENTIAL
  );
  registry.login();

  pipeline.setup(
    github: [
      email                      : lib.Constants.DEFAULT_GITHUB_ROBOT_EMAIL,
      usernamePasswordCredential : lib.Constants.DEFAULT_GITHUB_ROBOT_CREDENTIAL,
    ]
  );

  pipeline.build(
    timeout       : [time: 500, unit: 'MINUTES'],
    isSkippable   : false,
    operation     : {
        dir("${DEPENDENCY_SCAN_HOME}") {
            sh "npm set registry ${lib.Constants.DEFAULT_NPM_PRIVATE_REGISTRY_INSTALL}"
            sh "echo always-auth=true >> ~/.npmrc"
            sh "cp ~/.npmrc private_npmrc/.npmrc"
            sh "yarn install && yarn build"
            sh "node lib/index.js"
            sh "cd build && zip -r logs.zip logs/"
        }
    }
  )

  pipeline.createStage(
      name: "Publish Approvals Required",
      stage: {
          dir("${DEPENDENCY_SCAN_HOME}/build") {
            publishHTML(target: [
                reportName: "Pending Approvals Required",
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: "reports",
                reportFiles: "${PENDING_APPROVAL_REPORT_NAME}"
            ])
          }
      }
  )

  pipeline.createStage(
      name: "Publish Dependency Attribution Markdown File",
      stage: {
          dir("${DEPENDENCY_SCAN_HOME}/build") {
            publishHTML(target: [
                reportName: "Pending Dependency Attribution Markdown File",
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: "reports",
                reportFiles: "${MARKDOWN_REPORT_NAME}"
            ])
          }
      }
  )

  pipeline.createStage(
      name: "Publish Logs",
      stage: {
          dir("${DEPENDENCY_SCAN_HOME}/build") {
            archiveArtifacts artifacts: "logs.zip"
          }
      }
  )

  pipeline.end()
}