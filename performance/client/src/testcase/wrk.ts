/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import BaseTestCase from "./base";

export default class WrkTestCase extends BaseTestCase {
  // which endpoint to test
  public endpoint: string;
  // how many concurrent connections we can send to the target server
  public concurrency = 1;
  // timeout for the connection to target server
  public connectionTimeout = 30;
};
