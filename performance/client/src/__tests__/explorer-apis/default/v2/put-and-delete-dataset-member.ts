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
import { createTestDataset, cleanupTestDataset } from "../../../../utils/zowe";
import { getBasicAuthorizationHeader } from "../../../../utils";

class ExplorerApiPutAndDeleteDatasetMemberTest extends WrkSequentialEndpointsTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoints PUT /api/v2/datasets/{datasetName}/content and DELETE /api/v2/datasets/{datasetName}";

  endpoints = [
    {
      endpoint : "/api/v2/datasets/TEST.TESTDS(TST)/content",
      method   : "PUT",
      body     : `{"records":""}`,
      headers  : [
        "Content-Type: application/json",
      ],
      sequence : 0,
    },
    {
      delay    : [100, 100],
      endpoint : "/api/v2/datasets/TEST.TESTDS(TST)",
      method   : "DELETE",
      sequence : 10,
    },
  ] as SequentialHttpRequest[];

  duration = 5;
  concurrency = 1;
  threads = 1;

  async before(): Promise<void> {
    await super.before();

    await createTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS", "PO");

    this.headers.push(getBasicAuthorizationHeader());
  }

  async after(): Promise<void> {
    await super.after();

    await cleanupTestDataset(this.targetHost, this.targetPort, "TEST.TESTDS");
  }
}

new ExplorerApiPutAndDeleteDatasetMemberTest().init();
