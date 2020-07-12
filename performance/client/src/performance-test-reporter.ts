/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import * as fs from "fs";
import * as path from "path";
import { BaseReporter } from "@jest/reporters";
import type { AggregatedResult, TestResult } from "@jest/test-result";
import type { Config } from '@jest/types';
import type { Context, ReporterOnStartOptions, Test } from "@jest/reporters";
import { dump } from 'js-yaml';

import PerformanceTestException from "./exceptions/performance-test-exception";
import {
  DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS,
  PERFORMANCE_TEST_CONTEXT_FILE,
} from "./constants";
import type {
  PerformanceTestReporterOptions,
  PerformanceTestCaseReport,
  PerformanceTestReport,
} from "./types";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:test-reporter');

/**
 * Test reporter
 * 
 * This class collects all test report information and has methods to write to a
 * specific format.
 */
export default class PerformanceTestReporter extends BaseReporter {
  private _globalConfig: Config.GlobalConfig;
  private _options: PerformanceTestReporterOptions;

  private report: PerformanceTestReport;

  constructor(
    globalConfig: Config.GlobalConfig,
    options?: PerformanceTestReporterOptions,
  ) {
    super();
    this._globalConfig = globalConfig;
    this._options = { ...DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS, ...options};
    // debug('constructor(globalConfig):', globalConfig);
    debug('constructor(options):', this._options);

    // prepare report folder
    fs.mkdirSync(this._options.reportPath, { recursive: true });
  }

  onRunStart(
    _results?: AggregatedResult,
    _options?: ReporterOnStartOptions,
  ): void {
    // debug('onRunStart(_results):', _results);
    // debug('onRunStart(_options):', _options);

    this.report = {
      timestamps: {
        start: (new Date()).getTime(),
      },
      tests: [],
    };
  }

  onTestResult(
    _test?: Test,
    _testResult?: TestResult,
    _results?: AggregatedResult,
  ): void {
    // debug('onTestResult(_test):', _test);
    // debug('onTestResult(_testResult):', _testResult);
    // debug('onTestResult(_results):', _results);

    // _testResult.testResults should only have one element because the way how
    // we create test cases.
    if (
      !_testResult || !_testResult.testResults || !_testResult.testResults[0] ||
      !_testResult.testResults[0].status
    ) {
      throw new PerformanceTestException(`Cannot find test result for test ${_testResult.testFilePath}`);
    }

    const testEnv: {[key: string]: string} = Object.create({});
    for (const k of Object.keys(process.env)) {
      // ignore some environment variables
      if (k.startsWith('npm_')) {
        continue;
      }
      testEnv[k] = process.env[k];
    }

    // this context file should be written/prepared by test beforeAll step
    const testParameters = JSON.parse(fs.readFileSync(PERFORMANCE_TEST_CONTEXT_FILE).toString());

    const testCaseReport: PerformanceTestCaseReport = {
      name: _testResult.testResults[0].title,
      path: _testResult.testFilePath,
      timestamps: {
        start: _testResult.perfStats.start,
        end: _testResult.perfStats.end,
      },
      environments: testEnv,
      parameters: testParameters,
    };
    debug('onTestResult(testCaseReport):', testCaseReport);
    this.report.tests.push(testCaseReport);
  }

  // onTestStart(_test?: Test): void {
  //   debug('onTestStart(_test):', _test);
  // }

  onRunComplete(
    _contexts?: Set<Context>,
    _aggregatedResults?: AggregatedResult,
  ): Promise<void> | void {
    debug('onRunComplete(_contexts):', _contexts);
    debug('onRunComplete(_aggregatedResults):', _aggregatedResults);

    this.report.timestamps.end = (new Date()).getTime();
    debug('onRunComplete(report):', this.report);
    
    const reportFile = `test-report-${new Date().toISOString().replace(/[:\-]/g, "")}.${this._options.format}`;
    let content;
    if (this._options.format === 'yaml') {
      content = dump(this.report);
    } else {
      content = JSON.stringify(this.report);
    }
    fs.writeFileSync(path.join(this._options.reportPath, reportFile), content);
  }

}
