/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkTestCase from "../../../../testcase/wrk";
import { getBasicAuthorizationHeader } from "../../../../utils";
import { purgeJobOutputsWithoutFailure, validateFreeBerts, validateJesSpool, validateTsUsers } from "../../../../utils/zosmf";

class ExplorerApiDatasetMemberListTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoint /api/v1/datasets/{ds}/members";
  endpoint = "/api/v1/datasets/SYS1.HELP/members";

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

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
    await validateTsUsers();

    this.headers.push(getBasicAuthorizationHeader());
  }
}

new ExplorerApiDatasetMemberListTest().init();
