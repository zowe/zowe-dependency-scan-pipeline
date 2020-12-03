/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2020
 */

import WrkTestCase from "../../../../testcase/wrk";
import { getBasicAuthorizationHeader } from "../../../../utils";

class ExplorerApiDatasetContentTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test explorer api endpoint /api/v1/datasets/{ds}/content";
  endpoint = '/api/v1/datasets/SYS1.HELP(TIME)/content';

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

  async before(): Promise<void> {
    await super.before();
    this.headers.push(getBasicAuthorizationHeader());
  }
}

new ExplorerApiDatasetContentTest().init();
