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
import BaseTestCase from "./base";
import PerformanceTestException from "../exceptions/performance-test-exception";
import { parseWrkStdout } from "../utils/parse-wrk-stdout";
import { spawnPromise } from "../utils/spawn-promise";
import { HttpRequestMethod } from "../types";
import {
  PERFORMANCE_TEST_RESULT_FILE,
  PERFORMANCE_TEST_WRK_LUA_SCRIPT,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_NON_GET_REQUEST,
  PERFORMANCE_TEST_DEBUG_CONSOLE_LOG,
  DEFAULT_HTTP_REQUEST_METHOD,
  DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION,
  DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY,
} from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-testcase');

export default class WrkTestCase extends BaseTestCase {
  // http request method
  public method: HttpRequestMethod = DEFAULT_HTTP_REQUEST_METHOD;
  // which endpoint to test
  public endpoint: string;
  // extra HTTP headers to help on http calls
  public headers: string[] = [];
  // http request body
  public body = "";

  // how many concurrent connections we can send to the target server
  public concurrency = 1;
  // timeout for the connection to target server
  public connectionTimeout = 30;

  // wrk docker image will be used
  public dockerImage = "williamyeh/wrk";
  // lua script
  public luaScript: string;
  // display debugging information
  public debug = false;

  constructor(options?: {[key: string]: unknown}) {
    super(options);
  }

  protected _init(): void {
    super._init();

    // these parameters are mandatory for WRK tests
    if (!this.targetHost) {
      throw new PerformanceTestException("Target test server host is missing");
    }
    if (!this.targetPort) {
      throw new PerformanceTestException("Target test server port is missing");
    }

    if (!this.luaScript) {
      if (this.debug || this.method !== DEFAULT_HTTP_REQUEST_METHOD) {
        this.luaScript = PERFORMANCE_TEST_WRK_LUA_SCRIPTS_NON_GET_REQUEST;
      }
    }

    if (this.debug) {
      // for debugging purpose, always set to 1
      debug(`Running in debug mode, concurrency is set to ${DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY}, duration is set to ${DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION}`);
      this.concurrency = DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY;
      this.duration = DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION;
    }
  }

  async before(): Promise<void> {
    await super.before();

    // make sure image is already pulled to local before we start test
    await spawnPromise("docker", ["pull", this.dockerImage]);
    debug(`Docker image ${this.dockerImage} is prepared.`)

    // prepare lua script
    if (fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT);
    }
    if (this.luaScript) {
      this._prepareLuaScript(this.luaScript);
    }

    if (fs.existsSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG)) {
      fs.unlinkSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG);
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

  async run(): Promise<void> {
    const fullUrl = `https://${this.targetHost}:${this.targetPort}${this.endpoint}`;
    const headersWithOption: string[] = [];
    this.headers.forEach(header => {
      headersWithOption.push("--header");
      headersWithOption.push(header);
    });

    const dockerArgs = ["run", "--rm"];
    const wrkArgs = [
      "--duration",
      "" + this.duration + "s",
      "--threads",
      "" + this.concurrency,
      "--connections",
      "" + this.concurrency,
      ...headersWithOption,
      "--latency",
      "--timeout",
      "" + this.connectionTimeout + "s",
    ];
    if (this.luaScript) {
      dockerArgs.push("-v");
      dockerArgs.push(`${PERFORMANCE_TEST_WRK_LUA_SCRIPT}:/script.lua`);
      wrkArgs.push("--script");
      wrkArgs.push("/script.lua");
    }
    const cmdArgs = [...dockerArgs, this.dockerImage, ...wrkArgs, fullUrl];
    debug(`WRK command: docker ${cmdArgs.join(" ")}`);
    const { stdout, stderr } = await spawnPromise("docker", cmdArgs);
    debug(`WRK test stdout:\n${stdout}`);
    debug(`WRK test stderr:\n${stderr}`);
    if (this.debug) {
      fs.writeFileSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG, `==================== stdout ====================\n${stdout}\n\n==================== stderr ====================\n${stderr}`);
    }
    if (stderr) {
      throw new PerformanceTestException(`Wrk test failed: ${stderr}`);
    }
    const result = parseWrkStdout(stdout);
    debug("WRK test result:\n", result);

    fs.writeFileSync(PERFORMANCE_TEST_RESULT_FILE, JSON.stringify(result));
  }
}
