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
import { getJobId, getFileId } from "../../../../utils/zowe";
import PerformanceTestException from "../../../../exceptions/performance-test-exception";

class ExplorerApiJobOutputFileContentTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoint /api/v2/jobs/{jobName}/{jobId}/files/{fileId}/content";
  endpoint = '/api/v2/jobs/SDSF/{jobId}/files/{fileId}/content';

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

  async before(): Promise<void> {
    await super.before();

    // get active job ID
    const jobId = await getJobId(this.targetHost, this.targetPort, 'SDSF', 'ACTIVE', '*');
    if (!jobId) {
      throw new PerformanceTestException("Cannot find job ID for testing");
    }
    // get id of first job output file
    const fileId = await getFileId(this.targetHost, this.targetPort, 'SDSF', jobId);
    if (!fileId) {
      throw new PerformanceTestException("Cannot find job output file ID for testing");
    }

    // apply the changes to endpoint and test url
    this.endpoint = this.endpoint.replace('{jobId}', jobId);
    this.endpoint = this.endpoint.replace('{fileId}', fileId);
    this.fullUrl = `https://${this.targetHost}:${this.targetPort}${this.endpoint}`;

    this.headers.push(getBasicAuthorizationHeader());
  }
}

new ExplorerApiJobOutputFileContentTest().init();
