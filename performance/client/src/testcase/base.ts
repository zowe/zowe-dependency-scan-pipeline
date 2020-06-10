/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import { PerformanceTestCase, PerformanceTestParameters } from "../types";
import { DEFAULT_PERFORMANCE_TEST_PARAMETERS } from "../constants";
import { sleep } from "../utils";

export default class BaseTestCase implements PerformanceTestCase {
  // name of the test, short description
  public name: string;
  // test parameters
  protected params: PerformanceTestParameters;

  constructor(params?: PerformanceTestParameters) {
    this.params = {...DEFAULT_PERFORMANCE_TEST_PARAMETERS, ...params};
  }

  async run(): Promise<any> {
    await sleep(this.params.duration * 1000);
  }

  /**
   * Convert information defined for this class to a format jest can understand
   */
  init(): void {
    beforeEach(() => {
      // TODO: connect to metrics server
    });
    
    afterEach(() => {
      // TODO: ?
    });

    test(this.name, async () => {
      const rc = await this.run();
      if (rc !== undefined) {
        expect(rc).toBe(0);
      } else {
        expect(rc).toBeUndefined();
      }
    }, this.params.testTimeout);
  }
};
