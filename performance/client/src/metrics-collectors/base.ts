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
import { schedule, validate, ScheduledTask } from "node-cron";
import { MetricsCollectorOptions, MetricsCollector } from "../types";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:base-metrics-collector');

export default class BaseMetricsCollector implements MetricsCollector {
  protected _options: MetricsCollectorOptions;
  protected _cronTask: ScheduledTask; 

  constructor(options: MetricsCollectorOptions) {
    this._options = options;
    debug('metrics collector options:', this._options);
  }

  async prepare(): Promise<any> {
    this._cronTask = schedule(`*/${this._options.interval} * * * * *`, async () => {
      await this.poll();
    }, {
      scheduled: false
    });
  }

  async start(): Promise<any> {
    this._cronTask.start();
    fs.writeFileSync(this._options.cacheFile, "---\n", { flag: "w" });
  }

  async destroy(): Promise<any> {
    this._cronTask.destroy();
  }

  async poll(): Promise<any> {
  }
}
