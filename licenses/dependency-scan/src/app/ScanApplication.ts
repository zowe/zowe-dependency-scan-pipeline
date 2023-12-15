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

import { inject, injectable } from "inversify";
import { IAction } from "../actions/IAction";
import { Constants } from "../constants/Constants";
import { TYPES } from "../constants/Types";

@injectable()
export class ScanApplication {

    @inject(TYPES.CloneAction) private readonly cloneAction: IAction;
    @inject(TYPES.InstallAction) private readonly installAction: IAction;
    @inject(TYPES.NoticesReportAction) private readonly noticeReportaction: IAction;
    @inject(TYPES.OrtScanAction) private readonly analyzeScanAction: IAction;
    @inject(TYPES.LicenseReportAction) private readonly licenseReportAction: IAction;
    @inject(TYPES.OwaspScanReportAction) private readonly owaspScanReportAction: IAction;
    @inject(TYPES.OwaspPublishAction) private readonly owasPublishAction: IAction;

    public run() {
        const appFns: Array<() => Promise<any>> = [];

        // tslint:disable 
        // TSLint Disabled so I can do a heinous (op1,op2) within the ternary operator. 
        //      Confusing comma syntax, both statements are performed and the result of the second is returned..
        (Constants.EXEC_CLONE) ? (appFns.push(this.cloneAction.run.bind(this.cloneAction)), console.log("Will Execute Clone Step"))
            : console.log("Will Skip Clone Step");

        if (Constants.APP_LICENSE_SCAN) {
            console.log("Performing a License Scan");
            // tslint:disable 
            // TSLint Disabled so I can do a heinous (op1,op2) within the ternary operator. 
            //      Confusing comma syntax, both statements are performed and the result of the second is returned..
            (Constants.EXEC_SCANS) ? (appFns.push(this.analyzeScanAction.run.bind(this.analyzeScanAction)), console.log("Will Execute ORT Scan Step"))
                : console.log("Will Skip ORT Scan Step");
            (Constants.EXEC_REPORTS) ? (appFns.push(this.licenseReportAction.run.bind(this.licenseReportAction)), console.log("Will Execute Report Step"))
                : console.log("Will Skip Report Step");
        }
        if (Constants.APP_OWASP_SCAN) {
            console.log("Performing an OWASP Scan");
            // tslint:disable 
            // TSLint Disabled so I can do a heinous (op1,op2) within the ternary operator. 
            //      Confusing comma syntax, both statements are performed and the result of the second is returned..
            (Constants.EXEC_SCANS) ? (appFns.push(this.owaspScanReportAction.run.bind(this.owaspScanReportAction)), console.log("Will Execute OWASP Scan Step"))
                : console.log("Will Skip Scan Step");
            // (Constants.EXEC_REPORTS) ? (appFns.push(this.owaspReportAction.run.bind(this.owaspReportAction)), console.log("Will Execute OWASP Report Step"))
            //    : console.log("Will Skip Report Step");
            // (Constants.EXEC_REPORTS) ? (appFns.push(this.reportAction.run.bind(this.installAction)), console.log("Will Execute OWASP Publish Step"))
            //   : console.log("Will Skip Report Step");
        }
         if (Constants.APP_NOTICES_SCAN) {
            (Constants.EXEC_SCANS) ? (appFns.push(this.noticeReportaction.run.bind(this.noticeReportaction)), console.log("Will Execute Notices Report Step"))
                : console.log("Will Skip Scan Step");
        }
        // tslint:enable
        appFns.reduce((prev, cur) => prev.then(cur), Promise.resolve());
    }
}
