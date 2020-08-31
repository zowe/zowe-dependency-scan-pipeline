/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import ZMSBaseWorker from "./services/workers/base";

export type OutputFormat = "json" | "yaml";
export type HttpProtocol = "http" | "https";

type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface HttpServer {
  enabled: boolean;
  port: number;
}

interface HttpsServer extends HttpServer {
  // TODO: adding pfx support
  key: string;
  cert: string;
}

interface ZMSServer {
  http: HttpServer;
  https: HttpsServer;
}

export interface MetricsConfig {
  name: string;
  worker: string;
  options?: ZMSWorkerOptions;
}

interface Logstash {
  server?: string;
  port?: number;
  maxLines: number;
  program: string;
}

export interface LogConfig {
  name: string;
  source: string;
  script: string;
  maxLines: number;
}

export interface ZMSConfig {
  server: ZMSServer;
  metrics: MetricsConfig[];
  logstash: Logstash;
  logs: LogConfig[];
}

export interface MetricWorker extends MetricsConfig {
  workerObject?: ZMSBaseWorker;
  // timestamp of last polling
  lastPoll?: Date;
  // raw result of worker polling
  resultRaw?: MetricWorkerResultItem[];
  // normalized to string which can be displayed in /metrics endpoint
  result?: string;
}

export interface ZMSWorkerOptions {
  interval: number;
}
export type PartialZMSWorkerOptions = Partial<ZMSWorkerOptions>;

export interface ZMSShellWorkerOptions extends ZMSWorkerOptions {
  command: string;
  outputFormat: OutputFormat;
}
export type PartialZMSShellWorkerOptions = Partial<ZMSShellWorkerOptions>;

export interface ZMSRmfDdsWorkerOptions extends ZMSWorkerOptions {
  rmfDdsOptions: RmfDdsOptions;
  metrics: {[key: string]: string[]};
}
export type PartialZMSRmfDdsWorkerOptions = Partial<ZMSRmfDdsWorkerOptions>;

export interface MetricWorkerResultBaseItem {
  key: string;
  value: unknown;
}

export interface MetricWorkerResultItem extends MetricWorkerResultBaseItem {
  [key: string]: unknown;
}

export class ZMSException extends Error {
}

export interface RmfDdsOptions {
  protocol: HttpProtocol;
  host: string;
  port: number;
  performFilter: string;
}
export type PartialRmfDdsOptions = Partial<RmfDdsOptions>;

export interface RmfResource {
  label: string;
  type: string;
  expandable?: boolean;
  children?: RmfResource[];
}

export interface RmfMetric {
  id: string;
  description: string;
  format: string;
  unit: string;
}

export interface RmfResourceMetrics {
  resource: RmfResource;
  metrics: RmfMetric[];
}

export interface RmfIntervalFormat {
  interval: number;
  unit: string;
}

export interface RmfPerformanceTiming {
  // in YYYYMMDDHHMMSS format
  localStart: string;
  localEnd: string;
  utcStart: string;
  utcEnd: string;
  interval: RmfIntervalFormat;
}

export interface RmfPerformanceMessage {
  id: string;
  description: string;
  severity: number;
}

export interface RmfPerformanceRow {
  item: string;
  value: unknown;
  extra?: unknown;
}

export interface RmfMetricPerformance {
  metric: RmfMetric;
  resource: RmfResource;
  timing: RmfPerformanceTiming;
  rows: RmfPerformanceRow[];
  message?: RmfPerformanceMessage;
}

export class RmfException extends Error {
}
