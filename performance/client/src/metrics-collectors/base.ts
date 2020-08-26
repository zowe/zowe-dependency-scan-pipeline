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
import { MetricsCollectorOptions, MetricsCollector } from "../types";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:base-metrics-collector');

export default class BaseMetricsCollector implements MetricsCollector {
  protected options: MetricsCollectorOptions;
  protected _timer: NodeJS.Timeout;

  constructor(options: MetricsCollectorOptions) {
    this.options = options;
    debug('metrics collector options:', this.options);
  }

  async prepare(): Promise<any> {
    // dummy prepare method
  }

  async start(): Promise<any> {
    // start right away
    setTimeout(async () => {
      await this.poll();
    }, 0);

    // define scheduler
    this._timer = setInterval(async() => {
      await this.poll();
    }, this.options.interval * 1000);

    fs.writeFileSync(this.options.cacheFile, "---\n", { flag: "w" });
  }

  async destroy(): Promise<any> {
    clearInterval(this._timer);
  }

  async poll(): Promise<any> {
    // dummy poll statements
  }
}
