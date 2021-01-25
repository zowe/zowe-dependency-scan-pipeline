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
import { Cookie } from "tough-cookie";
import { getBasicAuthorizationHeaderValue } from "../utils";
import PerformanceTestException from "../exceptions/performance-test-exception";

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
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param jobName
 * @param jobStatus
 * @param jobOwner
 */
export const getJobId = async (apimlGatewayHost: string, apimlGatewayPort: number, jobName: string, jobStatus: string, jobOwner: string): Promise<string> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/jobs?prefix=${jobName}&status=${jobStatus}&owner=${jobOwner}`;

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
 * Get the fileID of first output file of a job
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param jobName
 * @param jobId
 */
export const getFileId = async (apimlGatewayHost: string, apimlGatewayPort: number, jobName: string, jobId: string): Promise<string> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/jobs/${jobName}/${jobId}/files`;

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

/**
 * Get cookie from Desktop auth endpoint
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param user
 * @param password
 */
export const getDesktopAuthenticationCookieHeader = async (apimlGatewayHost: string, apimlGatewayPort: number, user?: string, password?: string): Promise<string> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/ui/v1/zlux/auth`;

  if (!user) {
    user = process.env.TEST_AUTH_USER;
  }
  if (!password) {
    password = process.env.TEST_AUTH_PASSWORD;
  }
  if (!user || !password) {
    throw new PerformanceTestException("Username and password are required to login desktop");
  }

  const { statusCode, headers } = await got.post(url, {
    https: {
      rejectUnauthorized: false
    },
    json: {
      username: user,
      password,
    }
  });

  if (statusCode !== 200) {
    throw new PerformanceTestException(`Authentication failed with desktop, status code is ${statusCode}`);
  }

  let cookies: Cookie[] = [];
  if (Array.isArray(headers['set-cookie'])) {
    cookies = headers['set-cookie'].map((cookieString) => {
      return Cookie.parse(cookieString);
    });
  } else {
    cookies = [Cookie.parse(`${headers['set-cookie']}`)];
  }

  return 'Cookie: ' + cookies.map((cookie): string => {
    return cookie.key + '=' + cookie.value;
  }).join('; ');
};

/**
 * Create test dataset
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param datasetName
 * @param datasetOrganization
 */
export const createTestDataset = async (apimlGatewayHost: string, apimlGatewayPort: number, datasetName: string, datasetOrganization: string): Promise<string> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/datasets`;

  const { statusCode, headers } = await got.post(url, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    json: {
      "allocationUnit":"TRACK",
      "averageBlock":500,
      "blockSize":400,
      "dataSetOrganization":`${datasetOrganization}`,
      "deviceType":3390,
      "directoryBlocks":5,
      "name":`${datasetName}`,
      "primary":10,
      "recordFormat":"FB",
      "recordLength":80,
      "secondary":5
    }
  });

  return;
};

/**
 * Delete test dataset and verify deletion
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param datasetName
 */
export const cleanupTestDataset = async (apimlGatewayHost: string, apimlGatewayPort: number, datasetName: string): Promise<string> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/datasets/${datasetName}`;

  const { statusCode } =  await got.delete(url, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  });

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  }); 
  const datasets = body as {items: [{[key: string]: string|null}]};

  if (Array.isArray(datasets.items) && datasets.items.length) {
    throw new PerformanceTestException("Cleanup failed to delete test dataset: " + datasetName);
  }

  return;
};

/**
 * Create test unix file and verify creation
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param unixFilePath
 * @param testDirectoryPath
 */
export const createTestUnixFile = async (apimlGatewayHost: string, apimlGatewayPort: number, unixFilePath: string, testDirectoryPath: string): Promise<string> => {
  const fileUrl = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/unixfiles/${unixFilePath}`;
  const dirUrl = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/unixfiles?path=${testDirectoryPath}`;

  const { statusCode, headers } =  await got.post(fileUrl, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    json: {
      "type":"FILE"
    }
  });

  const { body } =  await got(dirUrl, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  });

  if (!JSON.stringify(body).includes("zowe-performance-test-file")) {
    throw new PerformanceTestException("Set up failed to create test unix file: " + unixFilePath);
  }

  return;
};

/**
 * Delete test unix file and verify deletion
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param unixFilePath
 * @param testDirectoryPath
 */
export const cleanupTestUnixFile = async (apimlGatewayHost: string, apimlGatewayPort: number, unixFilePath: string, testDirectoryPath: string): Promise<string> => {
  const fileUrl = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/unixfiles/${unixFilePath}`;
  const dirUrl = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v2/unixfiles?path=${testDirectoryPath}`;

  const { statusCode } =  await got.delete(fileUrl, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    json: {
      "type":"FILE"
    },
    responseType: 'json'
  });

  const { body } =  await got(dirUrl, {
    https: {
      rejectUnauthorized: false
    },
    headers: {
      'Authorization': getBasicAuthorizationHeaderValue()
    },
    responseType: 'json'
  });

  if (JSON.stringify(body).includes("zowe-performance-test-file")) {
    throw new PerformanceTestException("Cleanup failed to delete test unix file: " + unixFilePath);
  }

  return;
};
