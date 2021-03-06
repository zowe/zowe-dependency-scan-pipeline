/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { IncomingHttpHeaders } from "http2";

export interface PerformanceTestCase {
  // test case name
  name: string;

  // to prepare test
  before(): Promise<void|number>;
  // to clean up test
  after(): Promise<void|number>;
  // to perform test
  run(): Promise<void|number>;

  // this method will define the test which jest can understand
  // it should be called right away after the test case is defined
  init(): void;
}

export interface PerformanceTestParameters {
  // timeout for the jest test case
  testTimeout?: number;
}

export interface MetricsCollector {
  // this will be triggered before test starts
  prepare(): Promise<void>;
  // this will triggered when the test is started
  start(): Promise<void>;
  // this will be triggered after test ends
  destroy(): Promise<void>;
  // what should do for each poll
  poll(): Promise<void>;
}

export interface MetricsCollectorOptions {
  // what's the interval to collecting metrics, in seconds
  interval?: number;
  // after test finished, wait for this cooldown time and collect metrics again
  cooldown?: number;
  // file to store metrics
  cacheFile?: string;
  // metrics should be collected
  metrics?: string[];
  // metrics will be used to calculate CPU time and %
  cputimeMetrics?: string[];
}

// References:
// - https://nodejs.org/api/process.html#process_process_cpuusage_previousvalue
// - https://nodejs.org/api/process.html#process_process_memoryusage
// - https://nodejs.org/api/process.html#process_process_resourceusage
export type ClientMetrics = "cpu.system" | "cpu.user" |
                            "resource.fsRead" | "resource.fsWrite" |
                            "resource.involuntaryContextSwitches" | "resource.voluntaryContextSwitches" |
                            "resource.swappedOut" |
                            "resource.ipcReceived" | "resource.ipcSent" |
                            "resource.signalsCount" |
                            "resource.majorPageFault" | "resource.minorPageFault" |
                            "resource.sharedMemorySize" |
                            "resource.unsharedDataSize" | "resource.unsharedStackSize" |
                            "resource.maxRSS" | "memory.rss" |
                            "memory.heapTotal" | "memory.heapUsed" |
                            "memory.external" |
                            "memory.arrayBuffers";

export interface ClientMetricsCollectorOptions extends MetricsCollectorOptions {
  metrics?: ClientMetrics[];
}

export interface ZMSMetricsCollectorOptions extends MetricsCollectorOptions {
  zmsHost?: string;
  zmsPort?: number;
  zmsEndpoint?: string;
}

export type PerformanceTestReportFormat = 'json' | 'yaml';

export type PerformanceTestReporterOptions = {
  // default test report format, supported values are:
  format?: PerformanceTestReportFormat;
  // default path where to store test reports
  reportPath?: string;
};

export type PerformanceMetric = {
  timestamp: number;
  name: string;
  // this should usually be a number, but in case there are exceptions
  value: unknown;
};

export type PerformanceTestCaseReport = {
  name: string;
  timestamps: {
    start: number;
    end?: number;
  };
  path: string;
  status: string;
  failureMessages?: string[];
  environments: {[key: string]: unknown};
  parameters: {[key: string]: unknown};
  zoweVersions?: unknown;
  result?: {[key: string]: unknown};
  clientMetrics?: PerformanceMetric[];
  serverMetrics?: PerformanceMetric[];
  consoleLog?: string;
};

export type PerformanceTestReport = {
  timestamps: {
    start: number;
    end?: number;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    todo: number;
  };
  tests?: PerformanceTestCaseReport[];
};

export type HttpRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface HttpRequest {
  // http request method
  method?: HttpRequestMethod;
  // which endpoint to test
  endpoint: string;
  // extra HTTP headers to help on http calls
  headers?: string[];
  // http request body
  body?: string;
}

export interface WeightedHttpRequest extends HttpRequest {
  // weight for this http request
  weight?: number;
}

export interface SequentialHttpRequest extends HttpRequest {
  // sequence for this http request
  sequence?: number;
  // how many milliseconds to delay before next request
  // 2 numbers represent minimum and maximum time period
  delay?: [number, number];
}
export interface WrkHttpRequest {
  // http request method
  method?: HttpRequestMethod;
  // which endpoint to test
  endpoint: string;
  // extra HTTP headers to help on http calls
  // for wrk, this is key/value pairs
  headers?: {[key: string]: string};
  // http request body
  body?: string;
}

export interface WeightedWrkHttpRequest extends WrkHttpRequest {
  // weight for this http request
  weight?: number;
}

export interface SequentialWrkHttpRequest extends WrkHttpRequest {
  // sequence for this http request
  sequence?: number;
  // how many milliseconds to delay before next request
  // 2 numbers represent minimum and maximum time period
  delay?: [number, number];
}

export interface GotHttpResponse {
  statusCode: number;
  headers: IncomingHttpHeaders;
  // eslint-disable-next-line
  body: any;
}

export interface JesSpoolStatus {
  utilization?: number;
  volumes: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

export interface JesCheckpointSpace {
  bertNum: number;
  bertFree: number;
  bertWarn: number;
  checkpoints: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

export interface JesPurgeJobOutputResponse {
  rc: number;
  count: number;
  message?: string;
}

export interface JesSystemActivity {
  jobs: number;
  startedTasks: number;
  tsUsers: number;
  tsUsersUnderTso: number;
  maxTsUsersUnderTso: number;
  systemAddressSpaces: number;
  initiators: number;
  ussAddressSpaces: number;
}
export interface CeaSummary {
  status: {
    text: string;
    clients: number;
    internal: number;
  };
  events: {
    wto: number;
    enf: number;
    pgm: number;
  };
  tsoAddressSpaceManager: {
    allowed: number;
    inUse: number;
    highCount: number;
  };
}
