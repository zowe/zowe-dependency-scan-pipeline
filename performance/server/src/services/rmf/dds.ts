/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import got from "got";
import { parseStringPromise } from "xml2js";
import { 
  RmfDdsOptions, PartialRmfDdsOptions,
  RmfResource, RmfMetric, RmfResourceMetrics,
  RmfPerformanceTiming, RmfPerformanceMessage, RmfPerformanceRow, RmfMetricPerformance,
  RmfException,
} from "../../types";
import { DEFAULT_RMF_DDS_OPTIONS } from "../../constants";
import logger from "../logger";

export default class RmfDds {
  protected options: RmfDdsOptions;

  protected prefixUrl: string;

  // store data won't change
  // eslint-disable-next-line
  private _caches: {[key: string]: any} = {};

  constructor(options?: PartialRmfDdsOptions) {
    this.options = Object.assign({}, DEFAULT_RMF_DDS_OPTIONS, options);
    logger.silly("initialized rmf-dds with options: %j", this.options);

    this.prefixUrl = `${this.options.protocol}://${this.options.host}:${this.options.port}/gpm`;
  }

  getPrefixUrl(): string {
    return this.prefixUrl;
  }

  async validate(): Promise<boolean> {
    // check if RMF III is started
    // check if RMF DDS is started
    // check if host/port is available
    return true;
  }

  // eslint-disable-next-line
  async api(endpoint: string, param?: {[key: string]: any}): Promise<any> {
    try {
      const response = await got.get(endpoint, {
        searchParams: param,
        prefixUrl: this.prefixUrl
      });
      logger.silly("RmfDds API request on %s/%s (%j) returns: %j", this.prefixUrl, endpoint, param, response.body);

      const result = await parseStringPromise(response.body, {
        explicitArray: false
      });
      if (!result.ddsml) {
        throw new Error(`Invalid response from RMF DDS server: ${response.body.substr(0, 30)} ...`);
      }

      return result.ddsml;
    } catch (e) {
      logger.error("RmfDds API request on %s/%s (%j) failed: %j", this.prefixUrl, endpoint, param, e);
      logger.error("- message : %j", e.message);
      logger.error("- stack   : %j", e.stack);
      throw new RmfException(`RmfDds API request failed with ${e}`);
    }
  }

  async getResource(parent?: string, expandChildren = false): Promise<RmfResource[]> {
    const cacheKey = `resource-${expandChildren}[${parent ? parent: 'root'}]`;
    if (cacheKey in this._caches) {
      return this._caches[cacheKey];
    }

    const data = await this.api(
      parent ? "contained.xml" : "root.xml",
      {
        resource: `"${parent}"`,
      }
    );
    let resources = data['contained-resources-list'].contained.resource;
    if (!resources.length) {
      // convert to array if it's not
      resources = [resources];
    }

    const result: RmfResource[] = [];
    for (const resource of resources) {
      const r: RmfResource = {
        label: resource.reslabel,
        type: resource.restype,
        expandable: resource.expandable.toUpperCase() === 'YES',
      };

      if (expandChildren && r.expandable) {
        r.children = await this.getResource(r.label, expandChildren);
      }

      result.push(r);
    }

    this._caches[cacheKey] = result;
    return result;
  }

  async getResourceList(): Promise<RmfResource> {
    const root: RmfResource[] = await this.getResource(null, true);
    // root should only have 1 item
    return root[0];
  }

  async getMetricList(): Promise<RmfResourceMetrics[]> {
    const cacheKey = 'metric-list';
    if (cacheKey in this._caches) {
      return this._caches[cacheKey];
    }

    const data = await this.api("index.xml");
    const result: RmfResourceMetrics[] = [];

    for (const rm of data["metric-list"]) {
      const rs: RmfResource = {
        label: rm.resource.reslabel,
        type: rm.resource.restype,
        expandable: rm.resource.expandable.toUpperCase() === 'YES',
      };
      const rg: RmfResourceMetrics = {
        resource: rs,
        metrics: [],
      };

      if (rm["metric"]) {
        if (!rm["metric"].length) {
          // convert to array if it's not
          rm["metric"] = [rm["metric"]];
        }
        for (const m of rm["metric"]) {
          rg.metrics.push({
            id: m.$.id,
            description: m.description,
            format: m.format,
            unit: m.unit,
          } as RmfMetric);
        }
      }

      result.push(rg);
    }

    this._caches[cacheKey] = result;
    return result;
  }

  async getMetricResourceMap(): Promise<{[key: string]: string}> {
    const cacheKey = 'metric-resource-map';
    if (cacheKey in this._caches) {
      return this._caches[cacheKey];
    }

    const metricList = await this.getMetricList();
    const result: {[key: string]: string} = {};

    for (const rg of metricList) {
      for (const ms of rg.metrics) {
        const k = `${rg.resource.type}.${ms.id}`;
        result[k] = rg.resource.label;
      }
    }

    this._caches[cacheKey] = result;
    return result;
  }

  /**
   * Retrieve metric resource label.
   *
   * @param metric    Should be in a format of "<resource-type>.<metrid-id>".
   *                  For example, "AGGREGATE.8D5130".
   * @return          Resource label. For example, "IPO1,*,AGGREGATE".
   */
  async getMetricResource(metric: string): Promise<string> {
    const map: {[key: string]: string} = await this.getMetricResourceMap();
    if (metric in map) {
      return map[metric];
    } else {
      throw new RmfException(`Unsupported metric ${metric}`);
    }
  }

  async getMetricPerformance(metric: string): Promise<RmfMetricPerformance> {
    const resourceLabel = await this.getMetricResource(metric);
    const [ , id ] = metric.split('.');

    const data = await this.api("perform.xml", {
      resource: `"${resourceLabel}"`,
      id,
      filter: this.options.performFilter,
    });
    const report = data.report;
    if (!report) {
      throw new RmfException("RMF-DDS performance result doesn't have report.");
    }
    for (const k of ["metric", "resource", "time-data", "row"]) {
      if (!(k in report)) {
        throw new RmfException(`RMF-DDS performance report doesn't have ${k} information.`);
      }
    }

    const reportMetric: RmfMetric = {
      id: report.metric.$.id,
      description: report.metric.description,
      format: report.metric.format,
      unit: report.metric.unit,
    };

    const reportResource: RmfResource = {
      label: report.resource.reslabel,
      type: report.resource.restype,
    };

    const reportTiming: RmfPerformanceTiming = {
      localStart: report["time-data"]["local-start"],
      localEnd: report["time-data"]["local-end"],
      utcStart: report["time-data"]["utc-start"],
      utcEnd: report["time-data"]["utc-end"],
      interval: {
        interval: report["time-data"]["gatherer-interval"]["_"],
        unit: report["time-data"]["gatherer-interval"].$.unit,
      }
    };

    const reportRows: RmfPerformanceRow[] = [];
    for (const row of (report.row.length ? report.row : [report.row])) {
      if (!row.col || row.col < 2) {
        throw new RmfException(`Invalid RMF-DDS performance report row: ${row}`);
      }
      const reportRow: RmfPerformanceRow = {
        item: row.col[0],
        value: row.col[1],
        extra: row.col.slice(2),
      };

      reportRows.push(reportRow);
    }

    const result: RmfMetricPerformance = {
      metric: reportMetric,
      resource: reportResource,
      timing: reportTiming,
      rows: reportRows,
    };

    if (report.message) {
      const reportMessage: RmfPerformanceMessage = {
        id: report.message.$.id,
        description: report.message.description,
        severity: report.message.severity,
      };
      result.message = reportMessage;
    }

    return result;
  }
}
