/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkTestCase from "../../../testcase/wrk";

class PluginListTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test desktop api endpoint /ui/v1/zlux/plugins";
  endpoint = '/ui/v1/zlux/plugins?type=desktop';

  // duration = 15 * 60;
  // concurrency = 10;
  // FIXME: TEST-RUN-ONLY
  duration = 20;
  concurrency = 1;
  threads = 1;
}

new PluginListTest().init();
