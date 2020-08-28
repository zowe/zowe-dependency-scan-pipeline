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
import { promisify } from "util";
import { execFile } from "child_process";
import PerformanceTestException from "../exceptions/performance-test-exception";
import { parseWrkStdout } from "../utils/parse-wrk-stdout";
import { PERFORMANCE_TEST_RESULT_FILE } from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:wrk-testcase');

const execPromisified = promisify(execFile);

export default class WrkTestCase extends BaseTestCase {
  // which endpoint to test
  public endpoint: string;
  // how many concurrent connections we can send to the target server
  public concurrency = 1;
  // timeout for the connection to target server
  public connectionTimeout = 30;
  // extra HTTP headers to help on http calls
  public headers: string[] = [];

  public WRK_DOCKER_IMAGE = "williamyeh/wrk";

  constructor(options?: {[key: string]: any}) {
    super(options);

    // these parameters are mandatory for WRK tests
    if (!this.targetHost) {
      throw new PerformanceTestException("Target test server host is missing");
    }
    if (!this.targetPort) {
      throw new PerformanceTestException("Target test server port is missing");
    }
  }

  async before(): Promise<any> {
    await super.before();

    // make sure image is already pulled to local before we start test
    await execPromisified("docker", ["pull", this.WRK_DOCKER_IMAGE]);
    debug(`Docker image ${this.WRK_DOCKER_IMAGE} is prepared.`)
  }

  async run(): Promise<any> {
    const fullUrl = `https://${this.targetHost}:${this.targetPort}${this.endpoint}`;
    const headersWithOption: string[] = [];
    this.headers.forEach(header => {
      headersWithOption.push("--header");
      headersWithOption.push(header);
    });
    const cmdArgs = [
      "run",
      "--rm",
      this.WRK_DOCKER_IMAGE,
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
      fullUrl,
    ];
    debug(`WRK command: docker ${cmdArgs.join(" ")}`);
    const { stdout, stderr } = await execPromisified("docker", cmdArgs);
    debug(`WRK test stdout:\n${stdout}`);
    debug(`WRK test stderr:\n${stderr}`);
    if (stderr) {
      throw new PerformanceTestException(`Wrk test failed: ${stderr}`);
    }
    const result = parseWrkStdout(stdout);
    debug("WRK test result:\n", result);

    fs.writeFileSync(PERFORMANCE_TEST_RESULT_FILE, JSON.stringify(result));
  }
};
