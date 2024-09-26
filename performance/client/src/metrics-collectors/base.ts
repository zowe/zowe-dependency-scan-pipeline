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
import { sleep } from "../utils";
import PerformanceTestException from "../exceptions/performance-test-exception";
const debug = Debug('zowe-performance-test:base-metrics-collector');

export default class BaseMetricsCollector implements MetricsCollector {
  protected options: MetricsCollectorOptions;
  protected _timer: NodeJS.Timeout;

  constructor(options: MetricsCollectorOptions) {
    this.options = options;
    debug('metrics collector options:', this.options);
  }

  async prepare(): Promise<void> {
    // dummy prepare method
  }

  async start(): Promise<void> {
    if (fs.existsSync(this.options.cacheFile)) {
      fs.unlinkSync(this.options.cacheFile);
    }
    if (fs.existsSync(this.options.cacheFile)) {
      throw new PerformanceTestException('Cannot delete old metrics collector cache file');
    }

    // start right away
    setTimeout(async () => {
      debug("start first poll at", new Date());
      await this.poll();
    }, 0);

    // define scheduler
    this._timer = setInterval(async() => {
      debug("start scheduled poll at", new Date());
      await this.poll();
    }, this.options.interval * 1000);

    fs.writeFileSync(this.options.cacheFile, "---\n", { flag: "w" });
  }

  async destroy(): Promise<void> {
    clearInterval(this._timer);

    if (this.options.cooldown && this.options.cooldown > 0) {
      // wait for metrics cool down
      debug("wait for cool down", this.options.cooldown);
      this.options.cooldown && await sleep(this.options.cooldown * 1000);
      // poll metrics again
      debug("start last poll after cool down at", new Date());
      await this.poll();
    }
  }

  async poll(): Promise<void> {
    // dummy poll statements
  }
}
