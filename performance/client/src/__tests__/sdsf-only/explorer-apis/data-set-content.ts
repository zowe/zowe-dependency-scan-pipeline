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
import { getBasicAuthorizationHeader } from "../../../utils";
import { SDSF_ONLY_ZMS_CPUTIME_METRICS, SDSF_ONLY_ZMS_METRICS } from "../../../constants";

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
  endpoint = '/api/v1/datasets/SYS1.PARMLIB(ERBRMF00)/content';

  // enable debug mode?
  // Enabling debug mode will log every request/response sent to or received from
  // the target server. If this is true, these properties will be automatically
  // reset to these values to avoid excessive logs:
  // - duration: DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION
  // - concurrency: DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY
  // Enabling debug mode will also show the log in test report as `consoleLog`.
  // debug = true;

  // overwrite cooldown time for debugging purpose
  // cooldown = 0;

  // example to overwrite default collector options

  // collect SDSF metrics
  serverMetricsCollectorOptions = {
    metrics: SDSF_ONLY_ZMS_METRICS,
    cputimeMetrics: SDSF_ONLY_ZMS_CPUTIME_METRICS,
  };

  // example to overwrite default collector options
  // clientMetricsCollectorOptions = {};

  // we can add customized headers
  // headers = ["X-Special-Header: value"];

  async before(): Promise<void> {
    await super.before();

    // this test requires authentication header
    this.headers.push(getBasicAuthorizationHeader());
  }
}

// init test case
new ExplorerApiDatasetContentTest().init();
