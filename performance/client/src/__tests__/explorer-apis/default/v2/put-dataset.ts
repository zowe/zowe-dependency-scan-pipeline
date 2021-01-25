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
import { createTestDataset, cleanupTestDataset } from "../../../../utils/zowe";
import { getBasicAuthorizationHeader, sleep } from "../../../../utils";
import { HttpRequestMethod } from "../../../../types";

class ExplorerApiPutDatasetTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoints PUT /api/v2/datasets/{datasetName}/content";
  endpoint = '/api/v2/datasets/TEST.TESTDS/content';

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

    createTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS", "PS");

    this.headers.push(getBasicAuthorizationHeader());
  }

  async after(): Promise<void> {
    await super.after();

    cleanupTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS");
  }
}

new ExplorerApiPutDatasetTest().init();
