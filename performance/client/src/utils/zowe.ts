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
  const url = `https://${apimlGatewayHost}:${apimlGatewayPort}/api/v1/gateway/version`;
  debug(`Get Zowe versions from url ${url}`);

  const { body } =  await got(url, {
    https: {
      rejectUnauthorized: false
    }
  });
  debug(`Zowe versions url response: ${body}`);

  return JSON.parse(body);
};
