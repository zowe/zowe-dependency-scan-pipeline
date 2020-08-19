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
  options?: any;
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

export interface ZMSShellWorkerOptions extends ZMSWorkerOptions {
  command: string;
  outputFormat: OutputFormat;
}

export interface ZMSNodeWorkerOptions extends ZMSWorkerOptions {
  file: string;
}

export interface MetricWorkerResultBaseItem {
  key: string;
  value: any;
}

export interface MetricWorkerResultItem extends MetricWorkerResultBaseItem {
  [key: string]: any;
}

export class ZMSException extends Error {
}
