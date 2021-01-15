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
import { getBasicAuthorizationHeaderValue, httpRequest, parseHttpResponseCookies, prepareHttpRequestCookies } from "../utils";
import PerformanceTestException from "../exceptions/performance-test-exception";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:zowe-utils');

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
  const { body } = await httpRequest(
    apimlGatewayHost,
    apimlGatewayPort,
    '/api/v1/gateway/version'
  );

  return body;
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
  const { body } = await httpRequest(
    apimlGatewayHost,
    apimlGatewayPort,
    `/api/v2/jobs?prefix=${jobName}&status=${jobStatus}&owner=${jobOwner}`,
    'GET',
    {
      'Authorization': getBasicAuthorizationHeaderValue()
    }
  );

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
  const { body } = await httpRequest(
    apimlGatewayHost,
    apimlGatewayPort,
    `/api/v2/jobs/${jobName}/${jobId}/files`,
    'GET',
    {
      'Authorization': getBasicAuthorizationHeaderValue()
    }
  );

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
  if (!user) {
    user = process.env.TEST_AUTH_USER;
  }
  if (!password) {
    password = process.env.TEST_AUTH_PASSWORD;
  }
  if (!user || !password) {
    throw new PerformanceTestException("Username and password are required to login");
  }
  debug(`Authentication user: ${user}`);

  const { statusCode, headers } = await httpRequest(
    apimlGatewayHost,
    apimlGatewayPort,
    '/ui/v1/zlux/auth',
    'POST',
    {},
    {
      username: user,
      password,
    }
  );

  if (statusCode !== 200) {
    throw new PerformanceTestException(`Authentication failed with desktop, status code is ${statusCode}`);
  }

  return prepareHttpRequestCookies(parseHttpResponseCookies(headers));
};

/**
 * Get cookie from APIML Gateway auth endpoint
 *
 * @param apimlGatewayHost
 * @param apimlGatewayPort
 * @param user        username
 * @param password    password
 */
export const getApimlAuthenticationCookieHeader = async (apimlGatewayHost: string, apimlGatewayPort: number, user?: string, password?: string): Promise<string> => {
  if (!user) {
    user = process.env.TEST_AUTH_USER;
  }
  if (!password) {
    password = process.env.TEST_AUTH_PASSWORD;
  }
  if (!user || !password) {
    throw new PerformanceTestException("Username and password are required to login");
  }
  debug(`Authentication user: ${user}`);

  const { statusCode, headers } = await httpRequest(
    apimlGatewayHost,
    apimlGatewayPort,
    '/api/v1/gateway/auth/login',
    'POST',
    {},
    {
      username: user,
      password,
    }
  );

  if (statusCode !== 204) {
    throw new PerformanceTestException(`Authentication failed with Zowe APIML Gateway, status code is ${statusCode}`);
  }

  return prepareHttpRequestCookies(parseHttpResponseCookies(headers));
};
