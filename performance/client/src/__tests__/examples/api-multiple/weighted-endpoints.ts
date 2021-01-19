/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkWeightedEndpointsTestCase from "../../../testcase/wrk-weighted-endpoints";
import { WeightedHttpRequest } from "../../../types";
import { getApimlAuthenticationCookieHeader } from "../../../utils/zowe";

class ExampleWrkWeightedEndpointsTest extends WrkWeightedEndpointsTestCase {
  // name/purpose of the test
  name = "Test multiple endpoints at same time";
 
  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;
 
  // example: 15 minutes
  duration = 15 * 60;
  // duration = 30 ;

  // this will start multiple threads and each thread will pick randomly an endpoint from the list
  concurrency = 10;
 
  // endpoints we want to test
  endpoints = [
    {
      endpoint : "/api/v1/datasets/SYS1.PARMLIB(ERBRMF00)/content",
      // weight can be 0 (zero) which will make this endpoint not possible to be selected
      weight   : 1,
    },
    {
      endpoint : "/api/v1/gateway/auth/login",
      method   : "POST",
      body     : `{"username":"${process.env.TEST_AUTH_USER}","password":"${process.env.TEST_AUTH_PASSWORD}"}`,
      headers  : [
        "Content-Type: application/json",
        // overwrite Authorization provided globally
        "Authorization:",
      ],
      weight   : 3,
    },
  ] as WeightedHttpRequest[];

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
    this.headers.push(await getApimlAuthenticationCookieHeader(this.targetHost, this.targetPort));
  }
}

// init test case
new ExampleWrkWeightedEndpointsTest().init();
