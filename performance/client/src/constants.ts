/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { PerformanceTestReporterOptions } from "./types";

export const DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS: PerformanceTestReporterOptions = {
  format: 'json',
  reportPath: 'reports',
};

export const PERFORMANCE_TEST_CONTEXT_FILE = ".test-context.json";
export const PERFORMANCE_TEST_METRICS_ZMS_FILE = ".test-metrics-zms.yaml"
export const PERFORMANCE_TEST_METRICS_CLIENT_FILE = ".test-metrics-client.yaml"

// default test timeout is set to 1 day
export const DEFAULT_PERFORMANCE_TEST_TIMEOUT = 86400;

// default Zowe metric server port
export const DEFAULT_ZMS_PORT = 19000;

export const DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL = 2;
export const DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL = 2;
