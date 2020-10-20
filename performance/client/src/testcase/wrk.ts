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
import { HttpRequestMethod, HttpRequest } from "../types";
import {
  PERFORMANCE_TEST_WRK_LUA_SCRIPT,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_NON_GET_REQUEST,
  DEFAULT_HTTP_REQUEST_METHOD,
} from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-testcase');

/**
 * This test case can handle single endpoint test by using wrk.
 *
 * Ref: https://github.com/wg/wrk
 */
export default class WrkTestCase extends WrkBaseTestCase implements HttpRequest {
  // http request method
  public method: HttpRequestMethod = DEFAULT_HTTP_REQUEST_METHOD;
  // which endpoint to test
  public endpoint: string;
  // http request body
  public body = "";

  // these parameters will not be added to context and saved to test report
  protected ignoredParameters: string[] = [
    "ignoredParameters", "serverMetricsCollector", "clientMetricsCollector",
    "fullUrl", "mountPoints",
    // we ignore this for security purpose to avoid exposing authorization headers in reports
    "headers", "body",
  ];

  protected _init(): void {
    super._init();

    this.fullUrl = `https://${this.targetHost}:${this.targetPort}${this.endpoint}`;

    if (!this.luaScript) {
      if (this.debug || this.method !== DEFAULT_HTTP_REQUEST_METHOD) {
        this.luaScript = PERFORMANCE_TEST_WRK_LUA_SCRIPTS_NON_GET_REQUEST;
      }
    }
  }

  async before(): Promise<void> {
    await super.before();

    // prepare lua script
    if (fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT);
    }
    if (this.luaScript) {
      this._prepareLuaScript(this.luaScript);
      // these files must exist before we start the tests
      if (!fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
        throw new PerformanceTestException("Required LUA script is missing");
      }
      this.mountPoints['script.lua'] = PERFORMANCE_TEST_WRK_LUA_SCRIPT;
    }
  }

  private _prepareLuaScript(script: string): void {
    let content: string = fs.readFileSync(script).toString();

    // replace possible macros
    const macros: {[key: string]: string} = {
      body: JSON.stringify(this.body ? this.body.toString() : ""),
      method: JSON.stringify(this.method ? this.method.toString() : ""),
      debug: JSON.stringify(this.debug),
    };
    Object.keys(macros).forEach(k => {
      content = content.replace(`{{${k}}}`, macros[k]);
    });

    fs.writeFileSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT, content);
    debug(`LUA script ${PERFORMANCE_TEST_WRK_LUA_SCRIPT} is prepared:\n${content}`);
  }
}
