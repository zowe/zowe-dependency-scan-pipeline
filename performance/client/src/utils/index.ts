/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import PerformanceTestException from "../exceptions/performance-test-exception";
import got from "got";

/**
 * Sleep for certain time
 * @param {Integer} ms 
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Prepare Basic Authorization Header
 *
 * @param user        username
 * @param password    password
 */
export const getBasicAuthorizationHeader = (user?: string, password?: string): string => {
  if (!user) {
    user = process.env.TEST_AUTH_USER;
  }
  if (!password) {
    password = process.env.TEST_AUTH_PASSWORD;
  }
  if (user && password) {
    // use basic authentication
    const userPassBase64: string = Buffer.from(`${user}:${password}`).toString("base64");
    return `Authorization: Basic ${userPassBase64}`;
  } else {
    throw new PerformanceTestException("Authentication is required for this test");
  }
};

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
export const getZoweVersions = async (apimlGatewayHost: string, apimlGatewayPort: number): Promise<any> => {
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v1/gateway/version`;

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    }
  });

  return JSON.parse(body);
};
