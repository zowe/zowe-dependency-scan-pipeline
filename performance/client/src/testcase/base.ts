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
  PERFORMANCE_TEST_RESULT_FILE,
  PERFORMANCE_TEST_CONTEXT_FILE,
  PERFORMANCE_TEST_METRICS_ZMS_FILE,
  PERFORMANCE_TEST_METRICS_CLIENT_FILE,
  DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL,
  DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL,
  DEFAULT_CLIENT_METRICS,
  DEFAULT_ZMS_METRICS,

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
  // server side metrics collector options
  public serverMetricsCollectorOptions: {[key: string]: any};
  // client side metrics collector
  protected clientMetricsCollector: ClientMetricsCollector;
  // client side metrics collector options
  public clientMetricsCollectorOptions: {[key: string]: any};

  // how long this test should last in seconds
  public duration = 1;

  constructor(options?: {[key: string]: any}) {
    Object.assign(this, options);
  }

  protected _initMetricsCollector(): void {
    // init server metrics collector
    const smco: {[key: string]: any} = Object.create({});
    Object.assign(
      smco,
      {
        interval:  DEFAULT_SERVER_METRICS_COLLECTOR_INTERVAL,
        cacheFile: PERFORMANCE_TEST_METRICS_ZMS_FILE,
        metrics:   DEFAULT_ZMS_METRICS,
        zmsHost:   process.env.ZMS_HOST || null,
        zmsPort:   process.env.ZMS_PORT || null,
      },
      this.serverMetricsCollectorOptions,
    );
    this.serverMetricsCollectorOptions = smco;
    if (this.serverMetricsCollectorOptions.interval > 0) {
      if (this.serverMetricsCollectorOptions.zmsHost) {
        this.serverMetricsCollector = new ZMSMetricsCollector(this.serverMetricsCollectorOptions);
      } else {
        debug("WARNING: server side metrics collecting is disabled due to missing ZMS_HOST");
      }
    }

    // init client metrics collector
    const cmco: {[key: string]: any} = Object.create({});
    Object.assign(
      cmco,
      {
        interval:  DEFAULT_CLIENT_METRICS_COLLECTOR_INTERVAL,
        cacheFile: PERFORMANCE_TEST_METRICS_CLIENT_FILE,
        metrics:   DEFAULT_CLIENT_METRICS,
      },
      this.clientMetricsCollectorOptions,
    );
    this.clientMetricsCollectorOptions = cmco;
    if (this.clientMetricsCollectorOptions.interval > 0) {
      this.clientMetricsCollector = new ClientMetricsCollector(this.clientMetricsCollectorOptions);
    }
  }

  protected _getParameters(): {[key: string]: any} {
    const p: {[key: string]: any} = Object.create({});
    const ignoredParameters = [
      "serverMetricsCollector", "clientMetricsCollector"
    ];

    Object.entries(this).map(e => {
      if (ignoredParameters.indexOf(e[0]) === -1) {
        p[e[0]]=e[1];
      }
    });

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
    this._initMetricsCollector();

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

      // delete these file if exists
      if (fs.existsSync(PERFORMANCE_TEST_RESULT_FILE)) {
        fs.unlinkSync(PERFORMANCE_TEST_RESULT_FILE);
      }
      if (fs.existsSync(PERFORMANCE_TEST_METRICS_ZMS_FILE)) {
        fs.unlinkSync(PERFORMANCE_TEST_METRICS_ZMS_FILE);
      }
      if (fs.existsSync(PERFORMANCE_TEST_METRICS_CLIENT_FILE)) {
        fs.unlinkSync(PERFORMANCE_TEST_METRICS_CLIENT_FILE);
      }
    });

    beforeEach(async () => {
      this.serverMetricsCollector && await this.serverMetricsCollector.prepare();
      this.clientMetricsCollector && await this.clientMetricsCollector.prepare();

      const rc = await this.before();
      undefinedOrZero(rc);
    });

    afterEach(async () => {
      this.serverMetricsCollector && await this.serverMetricsCollector.destroy();
      this.clientMetricsCollector && await this.clientMetricsCollector.destroy();

      const rc = await this.after();
      undefinedOrZero(rc);
    });

    test(this.name, async () => {
      this.serverMetricsCollector && await this.serverMetricsCollector.start();
      this.clientMetricsCollector && await this.clientMetricsCollector.start();

      const rc = await this.run();
      undefinedOrZero(rc);
    }, this.testTimeout);
  }
};
