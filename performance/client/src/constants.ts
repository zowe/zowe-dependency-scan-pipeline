/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { PerformanceTestReporterOptions, PerformanceTestParameters } from "./types";

export const DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS: PerformanceTestReporterOptions = {
  format: 'json',
  reportPath: 'reports',
};

export const DEFAULT_PERFORMANCE_TEST_PARAMETERS: PerformanceTestParameters = {
  // default test duration
  duration: 1,
  // concurrency
  concurrency: 1,
  // default test timeout is set to 1 day
  testTimeout: 86400,
};

export const DEFAULT_ZMS_PORT = 19000;
