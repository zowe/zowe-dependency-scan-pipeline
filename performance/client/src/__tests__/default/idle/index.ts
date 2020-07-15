/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import BaseTestCase from "../../../testcase/base";

class IdleTest extends BaseTestCase {
  // name/purpose of the test
  name = "Test when Zowe is idling";

  // example: 15 minutes
  duration = 15 * 60;
  // duration = 15 ;
};

// init test case
new IdleTest().init();
