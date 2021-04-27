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
import { HttpRequestMethod } from "../../../types";

class DesktopAuthTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test desktop api endpoint /ui/v1/zlux/auth";
  endpoint = "/ui/v1/zlux/auth";

  method = "POST" as HttpRequestMethod;
  body = JSON.stringify({
    username: process.env.TEST_AUTH_USER,
    password: process.env.TEST_AUTH_PASSWORD,
  });
  headers = [
    "Content-Type: application/json",
  ];

  duration = 1;
  concurrency = 1;
  threads = 1;
}

new DesktopAuthTest().init();
