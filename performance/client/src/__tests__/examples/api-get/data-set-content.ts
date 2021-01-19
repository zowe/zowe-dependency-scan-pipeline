/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkTestCase from "../../../testcase/wrk";
import { getApimlAuthenticationCookieHeader } from "../../../utils/zowe";
import { purgeJobOutputsWithoutFailure, validateFreeBerts, validateJesSpool } from "../../../utils/zosmf";

class ExplorerApiDatasetContentTest extends WrkTestCase {
  // name/purpose of the test
  name = "Test explorer data sets api endpoint /datasets/{ds}/content";

  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;

  // example: 15 minutes
  duration = 15 * 60;
  // duration = 30 ;

  // endpoint we want to test
  endpoint = '/api/v2/datasets/SYS1.PARMLIB(ERBRMF00)/content';

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

  // example to overwrite default collector options
  // serverMetricsCollectorOptions = {
  //   // interval 0 will disable server side metrics collecting
  //   interval: 0,

  //   // example to define customized metrics
  //   metrics: [
  //     // my special metrics
  //     "my-special-metric-a", "my-special-metric-b",
  //     // example to collect CPU time for processes matching "MY*"
  //     // this is regular expression, please be aware of the special escape characters
  //     "cpu\\{source=\"rmf.dds\",item=\"MY.*\".+\\}",
  //   ],
  //   // also customize what metrics will be used for cpu time calculation
  //   cputimeMetrics: [
  //     "cpu\\{source=\"rmf.dds\",item=\"MY.*\".+\\}",
  //   ],
  // };

  // example to overwrite default collector options
  // clientMetricsCollectorOptions = {};

  // we can add customized headers
  // headers = ["X-Special-Header: value"];

  async before(): Promise<void> {
    await super.before();

    // depends on the endpoint, some tests may need these check
    // /api/v2/datasets will create TSO address spaces behind the scene,
    // we want to cleanup job outputs before and after test
    // cleanup job outputs before test
    await purgeJobOutputsWithoutFailure('TSU');
    // validate if JES spool percentage and free BERTs are good for test
    await validateFreeBerts();
    await validateJesSpool();

    // this test requires authentication header
    this.headers.push(await getApimlAuthenticationCookieHeader(this.targetHost, this.targetPort));
  }

  async after(): Promise<void> {
    await super.after();

    // cleanup job outputs after test
    await purgeJobOutputsWithoutFailure('TSU');
  }
}

// init test case
new ExplorerApiDatasetContentTest().init();
