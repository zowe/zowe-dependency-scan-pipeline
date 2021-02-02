/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkSequentialEndpointsTestCase from "../../../../testcase/wrk-sequential-endpoints";
import { SequentialHttpRequest } from "../../../../types";
import { getApimlAuthenticationCookieHeader, cleanupTestUnixFile } from "../../../../utils/zowe";
import { purgeJobOutputsWithoutFailure, validateFreeBerts, validateJesSpool, validateTsUsers } from "../../../../utils/zosmf";

class ExplorerApiPostAndDeleteUnixFileTest extends WrkSequentialEndpointsTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoints POST /api/v2/unixfiles/{path} and DELETE /api/v2/unixfiles/{path}"; 

  endpoints = [
    {
      endpoint : "/api/v2/unixfiles/tmp/zowe-performance-test-file",
      method   : "POST",
      body     : `{"type": "FILE"}`,
      headers  : [
        "Content-Type: application/json",
      ],
      sequence : 0,
    },
    {
      delay    : [100, 100],
      endpoint : "/api/v2/unixfiles/tmp/zowe-performance-test-file",
      method   : "DELETE",
      sequence : 10,
    },
  ] as SequentialHttpRequest[];

  duration = 15 * 60;
  concurrency = 1;
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

    this.headers.push(await getApimlAuthenticationCookieHeader(this.targetHost, this.targetPort));
  }

  async after(): Promise<void> {
    await super.after();

    await cleanupTestUnixFile(this.targetHost, this.targetPort, "tmp/zowe-performance-test-file", "/tmp");

    // cleanup job outputs after test
    await purgeJobOutputsWithoutFailure('TSU');
  }
}

new ExplorerApiPostAndDeleteUnixFileTest().init();
