/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { exec, ExecOptions } from "child_process";
import { promisify } from "util";
import { safeLoad } from "js-yaml";
import ZMSBaseWorker from "./base";
import { ZMSShellWorkerOptions, ZMSException, MetricWorkerResultItem } from "../../types";
import { DEFAULT_WORKER_OUTPUT_FORMAT, ZMS_COLLECTORS_DIR } from "../../constants";
import logger from "../logger";
import metricsManager from "../metrics-manager";

export default class ZMSShellWorker extends ZMSBaseWorker {
  protected options: ZMSShellWorkerOptions;

  constructor(name: string, options: ZMSShellWorkerOptions) {
    super(name, options);

    if (!this.options.outputFormat) {
      this.options.outputFormat = DEFAULT_WORKER_OUTPUT_FORMAT;
    }

    if (!this.options.command) {
      throw new ZMSException("command option is required for ZMSShellWorker");
    }
  }

  async poll(): Promise<void> {
    try {
      const execPromise = promisify(exec);
      logger.debug("shell worker \"%s\" polling: %s", this.name, this.options.command);

      const ts = new Date();
      const { stdout, stderr } = await execPromise(this.options.command, {
        cwd: ZMS_COLLECTORS_DIR,
      } as ExecOptions);
      if (stderr) {
        throw new ZMSException(`Shell command failed with error: ${stderr}`);
      }
      logger.silly("shell worker \"%s\" output: %j", this.name, { stdout, stderr });

      let result: MetricWorkerResultItem[];
      if (this.options.outputFormat === "json") {
        result = JSON.parse(stdout) as MetricWorkerResultItem[];
      } else if (this.options.outputFormat === "yaml") {
        result = safeLoad(stdout) as MetricWorkerResultItem[];
      } else {
        throw new ZMSException(`unsupported output format: ${this.options.outputFormat}`);
      }

      logger.info("shell worker \"%s\" returns %d records", this.name, result.length);
      logger.silly("shell worker \"%s\" parsed result: %j", this.name, result);
      metricsManager.updateResult(this.name, ts, result);
    } catch (e) {
      logger.warn(`Error on executing shell worker \"${this.name}\" command \"${this.options.command}\": ${JSON.stringify(e)} - ${JSON.stringify(e.message)}`);
      // log the error but do not exit
    }
  }
}
