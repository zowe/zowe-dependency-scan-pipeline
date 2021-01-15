/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import got, { Options } from "got";
import { IncomingHttpHeaders } from "http2";
import { Cookie } from "tough-cookie";
import PerformanceTestException from "../exceptions/performance-test-exception";

import Debug from 'debug';
import { GotHttpResponse } from "../types";
const debug = Debug('zowe-performance-test:utils');

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
 * Return safe environment variables which doesn't include unnecessary variables
 * and potential passwords.
 */
export const getSafeEnvironmentVariables = (): {[key: string]: string} => {
  const envVars: {[key: string]: string} = Object.create({});

  for (const k of Object.keys(process.env)) {
    // ignore some environment variables
    if (k.startsWith('npm_') ||
      k.startsWith('JENKINS_') || k.startsWith('HUDSON_') ||
      k.startsWith('TEST_AUTH_') || k.startsWith('SSH_USER') ||
      k.toLowerCase().indexOf('password') >= 0 ||
      k.toLowerCase().indexOf('passwd') >= 0) {
      continue;
    }
    envVars[k] = process.env[k];
  }

  return envVars;
};

/**
 * Parse HTTP Set-Cookie header(s) and return cookie list
 *
 * @param headers
 * @return    cookie list
 */
export const parseHttpResponseCookies = (headers: IncomingHttpHeaders): Cookie[] => {
  let cookies: Cookie[] = [];

  if (Array.isArray(headers['set-cookie'])) {
    cookies = headers['set-cookie'].map((cookieString) => {
      return Cookie.parse(cookieString);
    });
  } else {
    cookies = [Cookie.parse(`${headers['set-cookie']}`)];
  }

  return cookies;
};

/**
 * Prepare HTTP Cookie header
 *
 * @param cookies     cookie list
 * @return http request cookie header string
 */
export const prepareHttpRequestCookies = (cookies: Cookie[]): string => {
  return 'Cookie: ' + cookies.map((cookie): string => {
    return cookie.key + '=' + cookie.value;
  }).join('; ');
};

/**
 * Make HTTP request and return response
 *
 * NOTE: this method assumes request and response are both JSON.
 *
 * @param targetHost
 * @param targetPort
 * @param path        request path
 * @param method      request method, default is 'GET'
 * @param json        POST/PUT body
 */
export const httpRequest = async (targetHost: string, targetPort: number, path: string, options?: Options): Promise<GotHttpResponse> => {
  const url = `https://${targetHost}:${targetPort}${path}`;

  debug(`HTTP request url: ${url}`);

  try {
    // eslint-disable-next-line
    const response: any = await got(url, Object.assign({
      https: {
        rejectUnauthorized: false
      },
      responseType: 'json'
    }, options));
    const { statusCode, headers, body } = response;
    debug(`HTTP response status: ${statusCode}`);
    debug(`              headers: ${JSON.stringify(headers)}`);
    debug(`              body: ${JSON.stringify(body)}`);

    return { statusCode, headers, body };
  } catch (e) {
    if (e.response) {
      const { statusCode, headers, body } = e.response;
      debug(`HTTP response status: ${statusCode}`);
      debug(`              headers: ${JSON.stringify(headers)}`);
      debug(`              body: ${JSON.stringify(body)}`);

      return { statusCode, headers, body };
    } else {
      throw e;
    }
  }
};

/**
 * Prepare Basic Authorization Header
 *
 * @param user        username
 * @param password    password
 */
export const getBasicAuthorizationHeaderValue = (user?: string, password?: string): string => {
  if (!user) {
    user = process.env.TEST_AUTH_USER;
  }
  if (!password) {
    password = process.env.TEST_AUTH_PASSWORD;
  }
  if (user && password) {
    // use basic authentication
    const userPassBase64: string = Buffer.from(`${user}:${password}`).toString("base64");
    return `Basic ${userPassBase64}`;
  } else {
    throw new PerformanceTestException("Authentication is required for this test");
  }
};

/**
 * Prepare Basic Authorization Header
 *
 * @param user        username
 * @param password    password
 */
export const getBasicAuthorizationHeader = (user?: string, password?: string): string => {
  const authHeaderValue = getBasicAuthorizationHeaderValue(user, password);
  return `Authorization: ${authHeaderValue}`;
};
