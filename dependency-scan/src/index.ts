/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { bootstrap } from "./bootstrap/Bootstrap";
import { Container } from "inversify";
import { ScanApplication } from "./app/ScanApplication";

function bootstrapScan(): Promise<ScanApplication> {
    return bootstrap(new Container());
}

(async () => {
    bootstrapScan().then((app: ScanApplication) => {
        app.run();
    });
})();

