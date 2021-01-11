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
import { getBasicAuthorizationHeader } from "../../../../utils";

class ExplorerApiPostAndDeleteDatasetTest extends WrkSequentialEndpointsTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoints POST /api/v2/datasets and DELETE /api/v2/datasets/{datasetName}"; 

  endpoints = [
    {
      endpoint : "/api/v2/datasets",
      method   : "POST",
      body     : `{"allocationUnit":"TRACK","averageBlock":500,"blockSize":400,"dataSetOrganization":"PO","deviceType":3390,"directoryBlocks":5,"name":"TEST.TESTDS","primary":10,"recordFormat":"FB","recordLength":80,"secondary":5}`,
      headers  : [
        "Content-Type: application/json",
      ],
      sequence : 0,
    },
    {
      delay    : [100, 500],
      endpoint : "/api/v2/datasets/TEST.TESTDS",
      method   : "DELETE",
      sequence : 10,
    },
  ] as SequentialHttpRequest[];

  duration = 15 * 60;
  concurrency = 1;
  threads = 1;

  async before(): Promise<void> {
    await super.before();

    this.headers.push(getBasicAuthorizationHeader());
  }
}

new ExplorerApiPostAndDeleteDatasetTest().init();
