/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

module.exports = {
  rootDir: "./dist",
  testEnvironment: "node",
  // default timeout for a test, in ms
  testTimeout: 86400000,
  // what consider as slow
  slowTestThreshold: 3600,
  // use jest circus
  testRunner: "jest-circus/runner",
  reporters: [
    "default",

    // customized reporter will generate performance test report
    [
      "<rootDir>/performance-test-reporter",
      // use default options are defined in DEFAULT_PERFORMANCE_TEST_REPORTS_OPTIONS
      {
        "format": "yaml",
        // this can also be overwritten
        // "reportPath": "reports",
      }
    ]
  ]
};
