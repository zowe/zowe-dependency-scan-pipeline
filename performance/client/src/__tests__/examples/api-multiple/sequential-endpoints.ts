/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkSequentialEndpointsTestCase from "../../../testcase/wrk-sequential-endpoints";
import { SequentialHttpRequest } from "../../../types";
import { getBasicAuthorizationHeader } from "../../../utils";

class ExampleWrkSequentialEndpointsTest extends WrkSequentialEndpointsTestCase {
  // name/purpose of the test
  name = "Test multiple endpoints at same time";
 
  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;
 
  // example: 15 minutes
  duration = 15 * 60;
  // duration = 30 ;
 
  // this will start multiple threads and each thread will pick an endpoint from the list in sequence
  concurrency = 10;
 
  // endpoints we want to test
  endpoints = [
    {
      endpoint : "/api/v1/gateway/auth/login",
      method   : "POST",
      body     : `{"username":"${process.env.TEST_AUTH_USER}","password":"${process.env.TEST_AUTH_PASSWORD}"}`,
      headers  : [
        "Content-Type: application/json",
      ],
      sequence : 0,
    },
    {
      // wait for few seconds before sending this request
      delay    : [100, 500],
      endpoint : "/api/v1/datasets/SYS1.PARMLIB",
      sequence : 10,
    },
    {
      endpoint : "/api/v1/datasets/SYS1.PARMLIB(ERBRMF00)/content",
      sequence : 20,
    },
  ] as SequentialHttpRequest[];

  // enable debug mode?
  // Enabling debug mode will log every request/response sent to or received from
  // the target server. If this is true, these properties will be automatically
  // reset to these values to avoid excessive logs:
  // - duration: DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION
  // - concurrency: DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY
  // - threads: DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY
  // Enabling debug mode will also show the log in test report as `consoleLog`.
  // debug = true;

  // overwrite cooldown time for debugging purpose
  // cooldown = 0;
 
  // we can add customized headers
  // headers = ["X-Special-Header: value"];

  async before(): Promise<void> {
    await super.before();
 
    // this test requires authentication header
    this.headers.push(getBasicAuthorizationHeader());
  }
}

// init test case
new ExampleWrkSequentialEndpointsTest().init();
