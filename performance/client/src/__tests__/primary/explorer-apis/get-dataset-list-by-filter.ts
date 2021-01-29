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
import { purgeJobOutputsWithoutFailure, validateFreeBerts, validateJesSpool, validateTsUsers } from "../../../utils/zosmf";

class ExplorerApiDatasetListByFilterTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoint /api/v2/datasets/{filter}";
  endpoint = '/api/v2/datasets/SYS1.HELP';

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

  async before(): Promise<void> {
    await super.before();
    await purgeJobOutputsWithoutFailure('TSU');
    await validateFreeBerts();
    await validateJesSpool();
    await validateTsUsers();
    this.headers.push(await getApimlAuthenticationCookieHeader(this.targetHost, this.targetPort));
  }

  async after(): Promise<void> {
    await super.after();
    await purgeJobOutputsWithoutFailure('TSU');
  }
}

new ExplorerApiDatasetListByFilterTest().init();
