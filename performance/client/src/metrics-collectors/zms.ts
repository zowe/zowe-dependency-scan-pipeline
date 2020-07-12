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
import got from "got";
import BaseMetricsCollector from "./base";
import { ZMSMetricsCollectorOptions } from "../types";
import { DEFAULT_ZMS_METRICS, DEFAULT_ZMS_ENDPOINT, DEFAULT_ZMS_PORT } from "../constants";
import PerformanceTestException from "../exceptions/performance-test-exception";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:zms-metrics');

export default class ZMSMetricsCollector extends BaseMetricsCollector {
  protected options: ZMSMetricsCollectorOptions;
  private url: string;

  constructor(options: ZMSMetricsCollectorOptions) {
    super(options);

    if (!this.options.metrics) {
      this.options.metrics = DEFAULT_ZMS_METRICS;
    }

    if (!this.options.zmsHost) {
      if (process.env.ZMS_HOST) {
        this.options.zmsHost = process.env.ZMS_HOST;
      } else {
        throw new PerformanceTestException("Metrics server host is missing");
      }
    }
    if (!this.options.zmsPort) {
      if (process.env.ZMS_PORT) {
        this.options.zmsPort = parseInt(process.env.ZMS_PORT, 10);
      } else {
        this.options.zmsPort = DEFAULT_ZMS_PORT;
      }
    }
    if (!this.options.zmsEndpoint) {
      this.options.zmsEndpoint = DEFAULT_ZMS_ENDPOINT;
    }

    this.url = `https://${this.options.zmsHost}:${this.options.zmsPort}${this.options.zmsEndpoint}`;
  }

  async poll(): Promise<any> {
    debug('zms request starts');
    const { body } =  await got(this.url, {
      https: {
        rejectUnauthorized: false
      }
    });
    debug('zms request ends');
    const res = "^(" + this.options.metrics.join("|") + ")$";
    debug('metrics query:', res);
    const re = new RegExp(res);
    const ts = new Date().getTime();
    const content: string[] = [];

    body.split("\n").map(line => {
      line = line.trim();
      if (!line) {
        return;
      }

      const kv = line.split(/\s+/);
      if (kv[0] && kv[1]) {
        const t = kv[2] || ts;

        if (kv[0].match(re)) {
          debug(`- ${kv[0]} = ${kv[1]}`);

          content.push(`- timestamp: ${t}`);
          content.push(`  name: ${kv[0]}`);
          content.push(`  value: ${kv[1]}`);
        }
      }
    });

    fs.writeFileSync(this.options.cacheFile, content.join("\n") + "\n", { flag: "a" });
  }
};
