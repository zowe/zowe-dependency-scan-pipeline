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
import { getDesktopAuthenticationCookieHeader } from "../../../utils/zowe";

class DesktopDatasetContentTest extends WrkTestCase {
  fetchZoweVersions = true;

  name = "Test desktop api endpoint /ui/v1/zlux/datasetContents/{path}";
  endpoint = "/ui/v1/zlux/datasetContents/SYS1.HELP(TIME)";

  duration = 15 * 60;
  concurrency = 10;
  threads = 1;

  async before(): Promise<void> {
    await super.before();

    this.headers.push(await getDesktopAuthenticationCookieHeader(this.targetHost, this.targetPort, process.env.TEST_AUTH_USER, process.env.TEST_AUTH_PASSWORD));
    this.headers.push(`Referer: https://${this.targetHost}:${this.targetPort}/ui/v1/zlux`);
  }
}

new DesktopDatasetContentTest().init();
