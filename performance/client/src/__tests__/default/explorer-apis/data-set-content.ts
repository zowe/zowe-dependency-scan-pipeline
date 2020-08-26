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

class ExplorerApiDatasetContentTest extends WrkTestCase {
  // name/purpose of the test
  name = "Test explorer api endpoint /datasets/{ds}/content";

  // example: 15 minutes
  duration = 15 * 60;
  // duration = 30 ;

  // endpoint we want to test
  endpoint = '/api/v1/datasets/ZOWEAD3.PERF.TEST(PURGEJOB)/content';

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
  //     "CPU\\{process=\"MY.*\"\\}",
  //   ],
  // };

  // example to overwrite default collector options
  // clientMetricsCollectorOptions = {};

  // we can add customized headers
  // headers: string[] = ["X-Special-Header: value"];

  async before(): Promise<any> {
    await super.before();

    // this test requires authentication header
    this.headers.push(getBasicAuthorizationHeader());
  }
};

// init test case
new ExplorerApiDatasetContentTest().init();
