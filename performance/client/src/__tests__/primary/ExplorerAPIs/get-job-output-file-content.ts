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

class ExplorerApiJobOutputFileContentTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer data sets api endpoint /api/v2/jobs/{jobName}/{jobId}/files/{fileId}/content";
  endpoint = '/api/v2/jobs/SDSF/STC01060/files/3/content';

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

  async before(): Promise<void> {
    await super.before();
    this.headers.push(getBasicAuthorizationHeader());
  }
}

new ExplorerApiJobOutputFileContentTest().init();
