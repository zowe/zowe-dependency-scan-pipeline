/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import * as fs from "fs";
import WrkBaseTestCase from "./wrk-base";
import PerformanceTestException from "../exceptions/performance-test-exception";
import { SequentialHttpRequest, SequentialWrkHttpRequest } from "../types";
import {
  PERFORMANCE_TEST_WRK_LUA_SCRIPT,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_SEQUENTIAL_ENDPOINTS,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB,
  PERFORMANCE_TEST_WRK_ENDPOINTS_JSON,
  DEFAULT_HTTP_REQUEST_METHOD,
} from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-sequential-endpoints-testcase');

export default class WrkSequentialEndpointsTestCase extends WrkBaseTestCase {
  // all endpoints we want to test
  public endpoints: SequentialHttpRequest[];

  // these parameters will not be added to context and saved to test report
  protected ignoredParameters: string[] = [
    "ignoredParameters", "serverMetricsCollector", "clientMetricsCollector",
    "fullUrl", "mountPoints",
    // we ignore this for security purpose to avoid exposing authorization headers in reports
    "headers", "endpoints",
  ];

  // lua script
  public luaScript = PERFORMANCE_TEST_WRK_LUA_SCRIPTS_SEQUENTIAL_ENDPOINTS;

  protected _init(): void {
    super._init();

    if (!this.endpoints || this.endpoints.length === 0) {
      throw new PerformanceTestException("Test endpoints are missing");
    }
  }

  async before(): Promise<void> {
    await super.before();

    // prepare lua script & endpoints json
    if (fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT);
    }
    if (fs.existsSync(PERFORMANCE_TEST_WRK_ENDPOINTS_JSON)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_ENDPOINTS_JSON);
    }
    this._prepareLuaScript(this.luaScript);
    this._prepareSequentialEndpointsJson(this.endpoints);

    // these files must exist before we start the tests
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      throw new PerformanceTestException("Required LUA script is missing");
    }
    this.mountPoints['script.lua'] = PERFORMANCE_TEST_WRK_LUA_SCRIPT;
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB)) {
      throw new PerformanceTestException("Required LUA JSON lib is missing");
    }
    this.mountPoints['JSON.lua'] = PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB;
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_ENDPOINTS_JSON)) {
      throw new PerformanceTestException("Required endpoints JSON file is missing");
    }
    this.mountPoints['endpoints.json'] = PERFORMANCE_TEST_WRK_ENDPOINTS_JSON;
  }

  private _prepareLuaScript(script: string): void {
    let content: string = fs.readFileSync(script).toString();

    // replace possible macros
    const macros: {[key: string]: string} = {
      debug: JSON.stringify(this.debug),
    };
    Object.keys(macros).forEach(k => {
      content = content.replace(`{{${k}}}`, macros[k]);
    });

    fs.writeFileSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT, content);
    debug(`LUA script ${PERFORMANCE_TEST_WRK_LUA_SCRIPT} is prepared:\n${content}`);
  }

  private _prepareSequentialEndpointsJson(endpoints: SequentialHttpRequest[]): void {
    const contentJson = [];
    // we need to convert headers string to key/value pairs
    for (const endpoint of endpoints) {
      const convertedEndpoint: SequentialWrkHttpRequest = {
        endpoint: endpoint.endpoint,
        method: endpoint.method || DEFAULT_HTTP_REQUEST_METHOD,
        body: endpoint.body || "",
        sequence: endpoint.sequence || 0,
        delay: endpoint.delay || [0, 0],
        headers: {},
      };
      // convert headers to key/value pairs
      for (const header of endpoint.headers || []) {
        const indexOfSemiColon = header.indexOf(":");
        if (indexOfSemiColon > -1) {
          convertedEndpoint.headers[header.substr(0, indexOfSemiColon)] = header.substr(indexOfSemiColon + 1).trim();
        }
      }

      contentJson.push(convertedEndpoint);
    }
    const content = JSON.stringify(contentJson);

    fs.writeFileSync(PERFORMANCE_TEST_WRK_ENDPOINTS_JSON, content);
    debug(`Sequential endpoints JSON ${PERFORMANCE_TEST_WRK_ENDPOINTS_JSON} is prepared:\n${content}`);
  }
}
