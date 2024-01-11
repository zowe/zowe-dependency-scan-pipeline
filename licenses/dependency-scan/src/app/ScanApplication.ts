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
    @inject(TYPES.OrtScanAction) private readonly analyzeScanAction: IAction;
    @inject(TYPES.OrtReportAction) private readonly ortReportAction: IAction;
    @inject(TYPES.OrtSbomAction) private readonly ortSbomAction: IAction;
    @inject(TYPES.OwaspScanReportAction) private readonly owaspScanReportAction: IAction;
    @inject(TYPES.OwaspPublishAction) private readonly owasPublishAction: IAction;

    public async run() {
        const appFns: Array<() => Promise<any>> = [];
        // Step 1 - Clone
        if (Constants.EXEC_CLONE) {
            appFns.push(this.cloneAction.run.bind(this.cloneAction));
            console.log("Will Execute Clone Step");
        } else {
            console.log("Will Skip Clone Step")
        }

        // Step 2 - Determine Scan Type(s) and Add to Run Queue
        if (Constants.APP_ORT_REPORTS) {
            console.log("Performing a License Scan");
          
            if(Constants.EXEC_SCANS) {
                appFns.push(this.analyzeScanAction.run.bind(this.analyzeScanAction));
                console.log("Will Execute ORT Scan Step");
            } else {
                console.log("Will Skip ORT Scan Step");
            }
        
            if(Constants.EXEC_LICENSES_NOTICES) {
                appFns.push(this.ortReportAction.run.bind(this.ortReportAction));
                console.log("Will Execute ORT License and Notice Report Step")
            } else {
                console.log("Will Skip ORT License and Notice Report Step");
            }

            if (Constants.EXEC_SBOM) {
                appFns.push(this.ortSbomAction.run.bind(this.ortSbomAction));
                console.log("Will execute ORT SBOM Scanning Step");
            }
            else {
                console.log("Will skip ORT SBOM Report Step");
            }
                
        }
        if (Constants.APP_OWASP_SCAN) {
            console.log("Performing an OWASP Scan");
            if (Constants.EXEC_SCANS) {
                appFns.push(this.owaspScanReportAction.run.bind(this.owaspScanReportAction));
                console.log("Will Execute OWASP Scan Step");
            } else {
                console.log("Will Skip Scan Step");
            }
        }

        // Step 3 - Run Everything in order        
        appFns.reduce((prev, cur) => prev.then(cur), Promise.resolve());
    }
}
