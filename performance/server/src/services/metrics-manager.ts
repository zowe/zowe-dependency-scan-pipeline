/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { MetricsConfig, MetricWorker, ZMSWorkerOptions, MetricWorkerResultItem } from "../types";
import { ZMSWorkers, ZMSBaseWorker } from "./workers";
import logger from "./logger";
import { default as convertToOpenMetrics } from "./normalizers/openmetrics";

class MetricsManager {
  public metrics: {[key: string]: MetricWorker};

  constructor() {
    this.metrics = Object.create({});
  }

  async init(metrics: MetricsConfig[]): Promise<void> {
    logger.debug("> MetricsManager.init()");
    for (const mc of metrics) {
      await this.add(mc);
    }
  }

  async add(mc: MetricsConfig): Promise<void> {
    logger.debug("> MetricsManager.add(%j)", mc);
    const nm = Object.assign({}, mc) as MetricWorker;
    nm.workerObject = await this._createWorker(nm.name, nm.worker, nm.options);
    nm.lastPoll = null;
    nm.result = '';

    this.metrics[nm.name] = nm;
    logger.silly(">> MetricsManager.added: %j", nm);
  }

  private async _createWorker(name: string, worker: string, options: ZMSWorkerOptions): Promise<ZMSBaseWorker> {
    const workerObject: ZMSBaseWorker = new ZMSWorkers[worker](name, options);
    await workerObject.prepare();

    return workerObject;
  }

  async start(): Promise<void> {
    for (const name in this.metrics) {
      const m = this.metrics[name];
      logger.debug("> starting %s worker %s", m.worker, name);
      await m.workerObject.start();
    }
  }

  async destroy(): Promise<void> {
    for (const name in this.metrics) {
      const m = this.metrics[name];
      logger.debug("> destroying %s worker %s", m.worker, name);
      await m.workerObject.destroy();
    }
  }

  updateResult(name: string, timestamp: Date, result: MetricWorkerResultItem[]): void {
    logger.silly("> MetricsManager.updateMetrics(%s, %s, %j)", name, timestamp, result);
    const metric: MetricWorker = this.metrics[name];
    metric.resultRaw = result;
    metric.result = convertToOpenMetrics(result, timestamp);
    metric.lastPoll = timestamp;
  }

  getMetrics(): MetricWorker[] {
    logger.debug("> MetricsManager.getMetrics()");
    const metricsList: MetricWorker[] = Object.values(this.metrics);
    logger.silly("metrics list: %j", metricsList);
    return metricsList;
  }
}

export default new MetricsManager();
