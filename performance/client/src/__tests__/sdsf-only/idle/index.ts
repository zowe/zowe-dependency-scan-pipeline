/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import BaseTestCase from "../../../testcase/base";
import { SDSF_ONLY_ZMS_CPUTIME_METRICS, SDSF_ONLY_ZMS_METRICS } from "../../../constants";

class IdleTest extends BaseTestCase {
  // name/purpose of the test
  name = "Test when Zowe is idling";

  // fetch Zowe instance version information
  // this can be turned on if TARGET_PORT is Zowe APIML Gateway port
  fetchZoweVersions = true;

  // example: 15 minutes
  // duration = 15 * 60;
  duration = 30 ;

  // collect SDSF metrics
  serverMetricsCollectorOptions = {
    metrics: SDSF_ONLY_ZMS_METRICS,
    cputimeMetrics: SDSF_ONLY_ZMS_CPUTIME_METRICS,
  };
}

// init test case
new IdleTest().init();
