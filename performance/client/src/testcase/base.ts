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
import {
  PerformanceTestCase,
  MetricsCollector,
} from "../types";
import {
  DEFAULT_PERFORMANCE_TEST_TIMEOUT,
  PERFORMANCE_TEST_CONTEXT_FILE,
  PERFORMANCE_TEST_METRICS_ZMS_FILE,
  PERFORMANCE_TEST_METRICS_CLIENT_FILE,
  DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL,
  DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL,
} from "../constants";
import { sleep } from "../utils";
import ZMSMetricsCollector from "../metrics-collectors/zms";
import ClientMetricsCollector from "../metrics-collectors/client";

import Debug from 'debug';
const debug = Debug('zowe-performance-test:base-testcase');

export default class BaseTestCase implements PerformanceTestCase {
  // name of the test, short description
  public name: string;
  // timeout for the jest test case
  public testTimeout: number = DEFAULT_PERFORMANCE_TEST_TIMEOUT;
  // server side metrics collector
  protected serverMetricsCollector: MetricsCollector;
  protected clientMetricsCollector: ClientMetricsCollector;

  // how long this test should last in seconds
  public duration = 1;

  constructor(options?: {[key: string]: any}) {
    Object.assign(this, options);
    this.serverMetricsCollector = new ZMSMetricsCollector({
      interval: DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL,
      cacheFile: PERFORMANCE_TEST_METRICS_ZMS_FILE,
    });
    this.clientMetricsCollector = new ClientMetricsCollector({
      interval: DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL,
      cacheFile: PERFORMANCE_TEST_METRICS_CLIENT_FILE,
    })
  }

  protected _getParameters(): {[key: string]: any} {
    const p: {[key: string]: any} = Object.create({});

    Object.entries(this).map(e => {
      p[e[0]]=e[1];
    })

    return p;
  }

  async before(): Promise<any> {
    debug(
      `test "${this.name}" starts at ${new Date().toISOString()} with parameter`,
      this._getParameters()
    );
  }

  async after(): Promise<any> {
    debug(`test "${this.name}" ends at ${new Date().toISOString()}`);
  }

  async run(): Promise<any> {
    await sleep(this.duration * 1000);
  }

  /**
   * Convert information defined for this class to a format jest can understand
   */
  init(): void {
    const undefinedOrZero = (rc: any): void => {
      if (rc !== undefined) {
        expect(rc).toBe(0);
      } else {
        expect(rc).toBeUndefined();
      }
    };

    beforeAll(() => {
      // write text context to file
      // FIXME: write file because there is no reliable way to pass test variables
      //        to reporter
      // REF: https://github.com/facebook/jest/issues/7421
      fs.writeFileSync(PERFORMANCE_TEST_CONTEXT_FILE, JSON.stringify(this._getParameters()));
    });

    beforeEach(async () => {
      await this.serverMetricsCollector.prepare();
      await this.clientMetricsCollector.prepare();

      const rc = await this.before();
      undefinedOrZero(rc);
    });

    afterEach(async () => {
      await this.serverMetricsCollector.destroy();
      await this.clientMetricsCollector.destroy();

      const rc = await this.after();
      undefinedOrZero(rc);
    });

    test(this.name, async () => {
      await this.serverMetricsCollector.start();
      await this.clientMetricsCollector.start();

      const rc = await this.run();
      undefinedOrZero(rc);
    }, this.testTimeout);
  }
};
