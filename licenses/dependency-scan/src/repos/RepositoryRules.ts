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
import { TYPES } from "../constants/Types";
import { RepositoryInfo } from "./RepositoryInfo";
import { ReportInfo } from "./RepositoryReportDest";
import {RepoRulesType, RepoRule} from "./RepoRulesType";
import { Utilities } from "../utils/Utilities";
@injectable()
export class RepositoryRules {

    @inject(TYPES.RepoRulesData) private readonly repoRules: RepoRulesType;
    private readonly defaultGradleTool: string = "GradleInspector";
    private readonly forceOverwrite: string = "org.forceOverwrite=true"

    public makeOrtYaml(project: string): string {

        const mergedYaml = _.cloneDeep(this.repoRules["default"]);
        const projectRules = this.repoRules[project];

        if (projectRules?.analyzer) {
            mergedYaml.analyzer = _.merge(mergedYaml.analyzer || {}, projectRules.analyzer);
        }

        if (projectRules?.excludes) {
            mergedYaml.excludes = mergedYaml.excludes || {};
            if (projectRules.excludes.packages) {
                mergedYaml.excludes.packages = mergedYaml.excludes.packages || [];
                for (let pkg of projectRules.excludes.packages) {
                    mergedYaml.excludes.packages.push(pkg);
                }
            }
            if (projectRules.excludes.paths) {
                mergedYaml.excludes.paths = mergedYaml.excludes.paths || [];
                for (let path of projectRules.excludes.paths) {
                    mergedYaml.excludes.paths.push(path);
                }
            }
            if (projectRules.excludes.scopes) {
                mergedYaml.excludes.scopes = mergedYaml.excludes.scopes || [];
                for (let scope of projectRules.excludes.scopes) {
                    mergedYaml.excludes.scopes.push(scope);
                }
            }
        }

        if (projectRules?.toolsEnabled && projectRules.toolsEnabled.length > 0) {
            mergedYaml.analyzer = mergedYaml.analyzer || {};
            mergedYaml.analyzer.enabled_package_managers = projectRules.toolsEnabled;
        }
        
        return stringify(mergedYaml);
    }

    public getOrtAnalyzerFlags(projectDir: string): string[] { 
        let project = path.basename(projectDir);
        let flags: string[] = [];

        if (Utilities.dirHasGradleProject(projectDir) && this.repoRules[project]?.toolsEnabled == null) {
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