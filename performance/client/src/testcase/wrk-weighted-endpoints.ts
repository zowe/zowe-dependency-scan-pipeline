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
import {
  WeightedHttpRequest,
} from "../types";
import {
  PERFORMANCE_TEST_RESULT_FILE,
  PERFORMANCE_TEST_WRK_DOCKER_IMAGE,
  PERFORMANCE_TEST_WRK_LUA_SCRIPT,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_WEIGHTED_ENDPOINTS,
  PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB,
  PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON,
  PERFORMANCE_TEST_DEBUG_CONSOLE_LOG,
  DEFAULT_HTTP_REQUEST_METHOD,
  DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION,
  DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY,
} from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-weighted-endpoints-testcase');

export default class WrkWeightedEndpointsTestCase extends BaseTestCase {
  // all endpoints we want to test
  public endpoints: WeightedHttpRequest[];
  // extra HTTP headers to help on http calls
  // these headers will be added to all endpoints
  public headers: string[] = [];

  // how many concurrent connections we can send to the target server
  public concurrency = 1;
  // timeout for the connection to target server
  public connectionTimeout = 30;

  // wrk docker image will be used
  public dockerImage = PERFORMANCE_TEST_WRK_DOCKER_IMAGE;
  // lua script
  public luaScript = PERFORMANCE_TEST_WRK_LUA_SCRIPTS_WEIGHTED_ENDPOINTS;
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
    if (!this.endpoints || this.endpoints.length === 0) {
      throw new PerformanceTestException("Test endpoints are missing");
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

    // prepare lua script & endpoints json
    if (fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT);
    }
    if (fs.existsSync(PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON)) {
      fs.unlinkSync(PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON);
    }
    this._prepareLuaScript(this.luaScript);
    this._prepareWeightedEndpointsJson(this.endpoints);

    if (fs.existsSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG)) {
      fs.unlinkSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG);
    }

    // these files must exist before we start the tests
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT)) {
      throw new PerformanceTestException("Required LUA script is missing");
    }
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB)) {
      throw new PerformanceTestException("Required LUA JSON lib is missing");
    }
    if (!fs.existsSync(PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON)) {
      throw new PerformanceTestException("Required endpoints JSON file is missing");
    }
  }

  private _prepareLuaScript(script: string): void {
    let content: string = fs.readFileSync(script).toString();

    // replace possible macros
    const macros: {[key: string]: string} = {
      debug: JSON.stringify(this.debug),
      "weighted_endpoints_json": PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON,
    };
    Object.keys(macros).forEach(k => {
      content = content.replace(`{{${k}}}`, macros[k]);
    });

    fs.writeFileSync(PERFORMANCE_TEST_WRK_LUA_SCRIPT, content);
    debug(`LUA script ${PERFORMANCE_TEST_WRK_LUA_SCRIPT} is prepared:\n${content}`);
  }

  private _prepareWeightedEndpointsJson(endpoints: WeightedHttpRequest[]): void {
    const contentJson = [];
    // we need to convert headers string to key/value pairs
    for (const endpoint of endpoints) {
      const convertedEndpoint: {[key: string]: unknown} = {
        endpoint: endpoint.endpoint,
        method: endpoint.method || DEFAULT_HTTP_REQUEST_METHOD,
        body: endpoint.body || "",
        weight: endpoint.weight || 0,
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

    fs.writeFileSync(PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON, content);
    debug(`Weighted endpoints JSON ${PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON} is prepared:\n${content}`);
  }

  async run(): Promise<void> {
    const fullUrl = `https://${this.targetHost}:${this.targetPort}`;
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
    dockerArgs.push("-v");
    dockerArgs.push(`${PERFORMANCE_TEST_WRK_LUA_SCRIPT}:/data/script.lua`);
    dockerArgs.push("-v");
    dockerArgs.push(`${PERFORMANCE_TEST_WRK_LUA_SCRIPTS_JSON_LIB}:/data/JSON.lua`);
    dockerArgs.push("-v");
    dockerArgs.push(`${PERFORMANCE_TEST_WRK_WEIGHTED_ENDPOINTS_JSON}:/data/endpoints.json`);
    wrkArgs.push("--script");
    wrkArgs.push("/data/script.lua");

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
