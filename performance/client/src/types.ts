/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

export interface PerformanceTestCase {
  // test case name
  name: string;

  run(): Promise<void|number>;

  // this method will define the test which jest can understand
  // it should be called right away after the test case is defined
  init(): void;
};

export interface PerformanceTestParameters {
  // how long this test should last in seconds
  duration: number;

  // how many concurrent connections we can send to the target server
  concurrency?: number;

  // timeout for the connection to target server
  connectionTimeout?: number;

  // timeout for the jest test case
  testTimeout: number;
};

export type PerformanceTestReporterOptions = {
  // default test report format, supported values are:
  // - json
  // - yaml
  format?: string;
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
