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
import BaseMetricsCollector from "./base";
import { ClientMetricsCollectorOptions, ClientMetrics } from "../types";
import { DEFAULT_CLIENT_METRICS, DEFAULT_CLIENT_METRICS_COLLECTOR_COOLDOWN_TIME } from "../constants";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:client-metrics');

export default class ClientMetricsCollector extends BaseMetricsCollector {
  protected options: ClientMetricsCollectorOptions;

  private collectCpu = false;
  private collectMemory = false;
  private collectResource = false;

  constructor(options: ClientMetricsCollectorOptions) {
    super(options);

    if (!this.options.cooldown) {
      this.options.cooldown = DEFAULT_CLIENT_METRICS_COLLECTOR_COOLDOWN_TIME;
    }
    if (!this.options.metrics) {
      this.options.metrics = DEFAULT_CLIENT_METRICS;
    }

    for (const m of this.options.metrics) {
      if (m.startsWith("cpu.")) {
        this.collectCpu = true;
      } else if (m.startsWith("memory.")) {
        this.collectMemory = true;
      } else if (m.startsWith("resource.")) {
        this.collectResource = true;
      } 
    }
  }
 
  async poll(): Promise<any> {
    const ts = new Date().getTime();
    const content: string[] = [];

    if (this.collectCpu) {
      const cpuUsage = process.cpuUsage() as {[key: string]: any};
      Object.keys(cpuUsage).forEach(m => {
        if (this.options.metrics.includes("cpu." + m as ClientMetrics)) {
          debug(`- cpu.${m} = ${cpuUsage[m]}`);

          content.push(`- timestamp: ${ts}`);
          content.push(`  name: cpu.${m}`);
          content.push(`  value: ${cpuUsage[m]}`);
        }
      });
    }

    if (this.collectMemory) {
      const memoryUsage = process.memoryUsage() as {[key: string]: any};
      Object.keys(memoryUsage).forEach(m => {
        if (this.options.metrics.includes("memory." + m as ClientMetrics)) {
          debug(`- memory.${m} = ${memoryUsage[m]}`);

          content.push(`- timestamp: ${ts}`);
          content.push(`  name: memory.${m}`);
          content.push(`  value: ${memoryUsage[m]}`);
        }
      });
    }

    if (this.collectResource) {
      const resourceUsage = process.resourceUsage() as {[key: string]: any};
      Object.keys(resourceUsage).forEach(m => {
        if (this.options.metrics.includes("resource." + m as ClientMetrics)) {
          debug(`- resource.${m} = ${resourceUsage[m]}`);

          content.push(`- timestamp: ${ts}`);
          content.push(`  name: resource.${m}`);
          content.push(`  value: ${resourceUsage[m]}`);
        }
      });
    }

    fs.writeFileSync(this.options.cacheFile, content.join("\n") + "\n", { flag: "a" });
  }
};
