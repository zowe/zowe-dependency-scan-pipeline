/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import * as path from "path";
import {
  PerformanceTestReporterOptions,
  ClientMetrics,
  HttpRequestMethod,
} from "./types";

export const PERFORMANCE_TEST_ROOT_DIR = path.resolve(__dirname, "..");
export const PERFORMANCE_TEST_TMP_DIR = path.resolve(PERFORMANCE_TEST_ROOT_DIR, ".tmp");
export const PERFORMANCE_TEST_WRK_LUA_SCRIPTS_DIR = path.resolve(PERFORMANCE_TEST_ROOT_DIR, "src", "wrk-lua-scripts");
export const PERFORMANCE_TEST_WRK_LUA_SCRIPTS_NON_GET_REQUEST = path.resolve(PERFORMANCE_TEST_WRK_LUA_SCRIPTS_DIR, "non-get-request.lua");

export const DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS: PerformanceTestReporterOptions = {
  format: 'json',
  reportPath: 'reports',
};

export const PERFORMANCE_TEST_RESULT_FILE = path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-result.json");
export const PERFORMANCE_TEST_CONTEXT_FILE = path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-context.json");
export const PERFORMANCE_TEST_METRICS_ZMS_FILE = path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-metrics-zms.yaml");
export const PERFORMANCE_TEST_METRICS_CLIENT_FILE = path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-metrics-client.yaml");
export const PERFORMANCE_TEST_WRK_LUA_SCRIPT = path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-wrk-script.lua");
export const PERFORMANCE_TEST_DEBUG_CONSOLE_LOG= path.resolve(PERFORMANCE_TEST_TMP_DIR, "test-console-debug.log");

export const DEFAULT_CLIENT_METRICS: ClientMetrics[] = [
  "cpu.system", "cpu.user"
];

// default test timeout is set to 1 day
export const DEFAULT_PERFORMANCE_TEST_TIMEOUT = 86400 * 1000;

// default test concurrency if enable debug mode
export const DEFAULT_PERFORMANCE_TEST_DEBUG_CONCURRENCY = 1;
// default test duration if enable debug mode
export const DEFAULT_PERFORMANCE_TEST_DEBUG_DURATION = 2;

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

// these metrics will be used to calculate total CPU Time and %
// test result showing in report may contain these entries:
// - first_timestamp_from_server_metrics
// - last_timestamp_from_server_metrics
// - total_time_elapse_from_server_metrics
// - total_cpu_time_from_server_metrics
// - total_cpu_percentage_from_server_metrics
export const DEFAULT_ZMS_CPUTIME_METRICS: string[] = [
  "cpu\\{source=\"rmf.dds\",item=\"ZWE.*\".+\\}",
];

export const SDSF_ONLY_ZMS_METRICS: string[] = [
  "cpupr\\{source=\"sdsf.da\"\\}",
  "real\\{source=\"sdsf.sys\"\\}",
  "cpu\\{source=\"sdsf.da\",process=\"ZWE.*\".+\\}",
  "real\\{source=\"sdsf.da\",process=\"ZWE.*\".+\\}",
  "cpu\\{source=\"sdsf.da\",process=\"IZUSVR1\".+\\}",
  "real\\{source=\"sdsf.da\",process=\"IZUSVR1\".+\\}",
];

// these metrics will be used to calculate total CPU Time and %
// test result showing in report may contain these entries:
// - first_timestamp_from_server_metrics
// - last_timestamp_from_server_metrics
// - total_time_elapse_from_server_metrics
// - total_cpu_time_from_server_metrics
// - total_cpu_percentage_from_server_metrics
export const SDSF_ONLY_ZMS_CPUTIME_METRICS: string[] = [
  "cpu\\{source=\"sdsf.da\",process=\"ZWE.*\".+\\}",
];

export const DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL = 10;
export const DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL = 10;

// these cool down time can help on collect more accurate CPU time caused
// by the tests because of the delay on collecting metrics.
// this should be longer than the ZMS polling interval to get new data.
export const DEFAULT_SERVER_METRICS_COLLECTOR_COOLDOWN_TIME = 10;
// no cool down needed for client metrics collector
export const DEFAULT_CLIENT_METRICS_COLLECTOR_COOLDOWN_TIME = 0;

// default cool down time between 2 tests
// this number should be long enough for any api calls on the server to cool down
export const DEFAULT_TEST_COOLDOWN = 40;

export const DEFAULT_HTTP_REQUEST_METHOD: HttpRequestMethod = "GET";
