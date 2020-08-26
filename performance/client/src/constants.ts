/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { PerformanceTestReporterOptions, ClientMetrics } from "./types";

export const DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS: PerformanceTestReporterOptions = {
  format: 'json',
  reportPath: 'reports',
};

export const PERFORMANCE_TEST_RESULT_FILE = ".test-result.json";
export const PERFORMANCE_TEST_CONTEXT_FILE = ".test-context.json";
export const PERFORMANCE_TEST_METRICS_ZMS_FILE = ".test-metrics-zms.yaml";
export const PERFORMANCE_TEST_METRICS_CLIENT_FILE = ".test-metrics-client.yaml";

export const DEFAULT_CLIENT_METRICS: ClientMetrics[] = [
  "cpu.system", "cpu.user"
];

// default test timeout is set to 1 day
export const DEFAULT_PERFORMANCE_TEST_TIMEOUT = 86400;

// default Zowe metrics server port
export const DEFAULT_ZMS_PORT = 19000;
// default Zowe metrics server endpoint
export const DEFAULT_ZMS_ENDPOINT = "/metrics";

export const DEFAULT_ZMS_METRICS: string[] = [
  "cpupr\\{source=\"rmf.dds\"\\}",
  "real\\{source=\"sdsf.sys\"\\}",
  "cpu\\{source=\"rmf.dds\",item=\"ZWE.*\".+\\}",
  "real\\{source=\"rmf.dds\",item=\"ZWE.*\".+\\}",
  "cpu\\{source=\"rmf.dds\",item=\"IZUSVR1\".+\\}",
  "real\\{source=\"rmf.dds\",item=\"IZUSVR1\".+\\}",
];

export const DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL = 5;
export const DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL = 5;
