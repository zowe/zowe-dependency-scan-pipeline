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
import { createTestUnixFile, cleanupTestUnixFile } from "../../../../utils/zowe";
import { getBasicAuthorizationHeader, sleep } from "../../../../utils";
import { HttpRequestMethod } from "../../../../types";

class ExplorerApiPutUnixFileTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoints PUT /api/v2/unixfiles/{path}";
  endpoint = '/api/v2/unixfiles/tmp/zowe-performance-test-file';

  method = "PUT" as HttpRequestMethod;
  body = JSON.stringify({
    content: "Hello World"
  });
  headers = [
    "Content-Type: application/json",
  ];

  duration = 15 * 60;
  concurrency = 1;
  threads = 1;

  async before(): Promise<void> {
    await super.before();

    await createTestUnixFile(this.targetHost, this.targetPort, "tmp/zowe-performance-test-file", "/tmp");

    this.headers.push(getBasicAuthorizationHeader());
  }

  async after(): Promise<void> {
    await super.after();

    await cleanupTestUnixFile(this.targetHost, this.targetPort, "tmp/zowe-performance-test-file", "/tmp");
    
  }
}

new ExplorerApiPutUnixFileTest().init();
