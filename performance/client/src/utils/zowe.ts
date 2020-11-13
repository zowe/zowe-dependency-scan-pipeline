/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import got from "got";
import { getBasicAuthorizationHeaderValue } from "../utils";

/**
 * Fetch Zowe instance version from APIML Gateway
 * 
 * Note: some versions of Zowe instance doesn't have ZOWE_MANIFEST environment
 *       variable defined. This variable should be pointed to Zowe runtime
 *       directory manifest.json file. It's mandatory to retrieve Zowe version
 *       other than just APIML version.
 *
 *       ZOWE_MANIFEST entry can be added to instance.env like this:
 *
 *       ZOWE_MANIFEST="${ROOT_DIR}/manifest.json"
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 */
export const getZoweVersions = async (apimlGatewayHost: string, apimlGatewayPort: number): Promise<unknown> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v1/gateway/version`;

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    }
  });

  return JSON.parse(body);
};

/**
 * Get the jobID of a job
 *
 * @param jobName
 * @param jobStatus
 * @param jobOwner
 */
export const getJobId = async (targetHost: string, targetPort: number, jobName: string, jobStatus: string, jobOwner: string): Promise<string> => {
  const url = `https://${targetHost}:${targetPort}/api/v2/jobs?prefix=${jobName}&status=${jobStatus}&owner=${jobOwner}`;

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  }); 
  const jobs = body as {items: [{[key: string]: string|null}]};
  const jobId = jobs && jobs.items[0] && jobs.items[0]['jobId'];

  return jobId;
};

/**
 * Get the the fileID of first output file of a job
 *
 * @param jobName
 * @param jobId
 */
export const getFileId = async (targetHost: string, targetPort: number, jobName: string, jobId: string): Promise<string> => {
  const url = `https://${targetHost}:${targetPort}/api/v2/jobs/${jobName}/${jobId}/files`;

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  }); 
  const files = body as {items: [{[key: string]: string|null}]};
  const fileId = files && files.items[0] && files.items[0]['id'];

  return fileId;
};
