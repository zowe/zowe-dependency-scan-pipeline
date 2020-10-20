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
  PERFORMANCE_TEST_RESULT_FILE,
  PERFORMANCE_TEST_WRK_DOCKER_IMAGE,
  PERFORMANCE_TEST_DEBUG_CONSOLE_LOG,
  DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION,
  DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY,
} from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-base-testcase');

export default class WrkBaseTestCase extends BaseTestCase {
  // global HTTP headers to help on http calls
  // these headers will be added to all endpoints
  public headers: string[] = [];

  // how many concurrent connections we can send to the target server
  public concurrency = 1;
  // timeout for the connection to target server
  public connectionTimeout = 30;

  // wrk docker image will be used
  public dockerImage = PERFORMANCE_TEST_WRK_DOCKER_IMAGE;
  // full url will pass to wrk
  public fullUrl: string;
  // lua script
  public luaScript: string;
  // docker container mount points
  public mountPoints: {[key: string]: string} = {};
  // display debugging information
  public debug = false;

  // these parameters will not be added to context and saved to test report
  protected ignoredParameters: string[] = [
    "ignoredParameters", "serverMetricsCollector", "clientMetricsCollector",
    "fullUrl", "mountPoints",
    // we ignore this for security purpose to avoid exposing authorization headers in reports
    "headers",
  ];

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
    this.fullUrl = `https://${this.targetHost}:${this.targetPort}`;

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

    if (fs.existsSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG)) {
      fs.unlinkSync(PERFORMANCE_TEST_DEBUG_CONSOLE_LOG);
    }
  }

  async run(): Promise<void> {
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
    for (const inside of Object.keys(this.mountPoints)) {
      dockerArgs.push("-v");
      dockerArgs.push(`${this.mountPoints[inside]}:/data/${inside}`);
    }
    if (this.luaScript) { // always mount to script.lua
      wrkArgs.push("--script");
      wrkArgs.push("/data/script.lua");
    }
    const cmdArgs = [...dockerArgs, this.dockerImage, ...wrkArgs, this.fullUrl];
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
