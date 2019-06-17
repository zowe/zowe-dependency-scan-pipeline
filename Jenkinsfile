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

  pipeline.build(
    timeout       : [time: 5, unit: 'MINUTES'],
    isSkippable   : false,
    operation     : {

        sh "cat .npmrc"
    }
  )

  pipeline.end()
}