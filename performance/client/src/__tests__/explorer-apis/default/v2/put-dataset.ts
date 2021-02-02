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
import { getApimlAuthenticationCookieHeader, createTestDataset, cleanupTestDataset } from "../../../../utils/zowe";
import { purgeJobOutputsWithoutFailure, validateFreeBerts, validateJesSpool, validateTsUsers } from "../../../../utils/zosmf";
import { HttpRequestMethod } from "../../../../types";

class ExplorerApiPutDatasetTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoint PUT /api/v2/datasets/{datasetName}/content";
  endpoint = "/api/v2/datasets/TEST.TESTDS/content";

  method = "PUT" as HttpRequestMethod;
  body = JSON.stringify({
    records: "//HELLOWORLD"
  });
  headers = [
    "Content-Type: application/json",
  ];

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

    createTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS", "PS");

    this.headers.push(await getApimlAuthenticationCookieHeader(this.targetHost, this.targetPort));
  }

  async after(): Promise<void> {
    await super.after();

    cleanupTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS");

    // cleanup job outputs after test
    await purgeJobOutputsWithoutFailure('TSU');
  }
}

new ExplorerApiPutDatasetTest().init();
