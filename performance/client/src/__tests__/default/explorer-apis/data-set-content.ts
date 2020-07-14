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
  name = "Test explorer api endpoint /datasets/{ds}/content";

  // 15 minutes
  duration = 15 * 60;

  endpoint = '/api/v1/datasets/ZOWEAD3.PERF.TEST(PURGEJOB)/content';

  headers: string[] = [];

  async before(): Promise<any> {
    await super.before();

    this.headers.push(getBasicAuthorizationHeader());
}
};

new ExplorerApiDatasetContentTest().init();
