/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import type {Global} from '@jest/types';

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
};

export interface PerformanceTestParameters {
  // timeout for the jest test case
  testTimeout?: number;
};

export interface MetricsCollector {

};

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
  value: any;
};

export type PerformanceTestCaseReport = {
  name: string;
  timestamps: {
    start: number;
    end?: number;
  };
  path: string;
  environments: {[key: string]: any};
  parameters: {[key: string]: any};
  result?: {[key: string]: any};
  serverMetrics?: PerformanceMetric[];
};

export type PerformanceTestReport = {
  timestamps: {
    start: number;
    end?: number;
  };
  tests?: PerformanceTestCaseReport[];
};
