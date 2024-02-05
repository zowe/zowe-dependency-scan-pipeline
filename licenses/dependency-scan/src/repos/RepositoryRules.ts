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
import * as path from "path";
import { stringify } from "yaml";
import * as _ from "lodash";
import * as fs from "fs-extra";
import { isNullOrUndefined } from "util";
import { TYPES } from "../constants/Types";
import { RepositoryInfo } from "./RepositoryInfo";
import { ReportInfo } from "./RepositoryReportDest";
import {RepoRulesType, RepoRule} from "./RepoRulesType";
import { Utilities } from "../utils/Utilities";
@injectable()
export class RepositoryRules {

    @inject(TYPES.RepoRulesData) private readonly repoRules: RepoRulesType;
    private readonly defaultGradleTool: string = "GradleInspector";
    private readonly skipEncluded: string = "ort.analyzer.skipExcluded=true"
    private readonly forceOverwrite: string = "org.forceOverwrite=true"

    public makeOrtYaml(project: string): string {

        const merged = _.merge({}, this.repoRules["default"], this.repoRules[project]);

        return stringify(merged);

    }

    public getOrtAnalyzerFlags(projectDir: string): string[] { 
        let project = path.basename(projectDir);
        let flags: string[] = [];
        // always try to skip excluded to improve performance
        flags.push("-P", this.skipEncluded);

        if (this.repoRules[project]?.toolsEnabled?.length > 0) {
            flags.push("-P", this.getPkgManagerFlag(this.repoRules[project]?.toolsEnabled));
        } else if (Utilities.dirHasGradleProject(projectDir)) {
            flags.push("-P", this.getPkgManagerFlag([this.defaultGradleTool]))
        } // else we don't specify and rely on default discovery of pkg manager

        // if something exists we should clean it up
        if (fs.existsSync(path.join(projectDir, "analyzer-result.json"))) {
            flags.push("-P", this.forceOverwrite);
        }

        return flags;
    }


    private getPkgManagerFlag(pkgManagers: string[]): string {
        return "ort.analyzer.enabledPackageManagers="+pkgManagers.join(",")
    }



}