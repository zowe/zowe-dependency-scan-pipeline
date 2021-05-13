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
import { isNullOrUndefined } from "util";
import { TYPES } from "../constants/Types";
import { RepositoryInfo } from "./RepositoryInfo";

@injectable()
export class RepositoryRules {

    @inject(TYPES.RepoRulesData) private readonly repoRules: any;
    private readonly IGNORE_KEY: string = "ignores";
    private readonly GRADLE_KEY: string = "gradleArgs";
    private readonly PATHS_KEY: string = "paths";

    /**
     * Some repositories/projects have submodules within them.
     * This returns the relative paths to those submodules
     * 
     * @param projects
     */
    public getExtraProjectPaths(projects: string[]): string[] {
        const extraPaths: string[] = [];
        projects.forEach((project: string) => {
            const repoRule = this.repoRules[project];
            if (!isNullOrUndefined(repoRule) && !isNullOrUndefined(repoRule[this.PATHS_KEY])) {
                const subPaths: string[] = repoRule[this.PATHS_KEY];
                subPaths.forEach((subpath: string) => {
                    extraPaths.push(path.join(project, subpath));
                });
            }
        });
        return extraPaths;
    }

    /**
    * 
    * @param project 
    */
    public getExtraPathForRepository(repoInfo: RepositoryInfo): string[] {
        const extraPaths: string[] = [];
        const repoRule = this.repoRules[repoInfo.repository];
        if (!isNullOrUndefined(repoRule) && !isNullOrUndefined(repoRule[this.PATHS_KEY])) {
            const subPaths: string[] = repoRule[this.PATHS_KEY];
            subPaths.forEach((subpath: string) => {
                extraPaths.push(path.join(repoInfo.repository, subpath));
            });
        }
        return extraPaths;
    }

    /**
     * 
     * @param project 
     */
    public getExtraPathForRepositories(repoInfo: RepositoryInfo[]): string[] {
        let extraPaths: string[] = [];
        repoInfo.forEach((repo) => {
            extraPaths = extraPaths.concat(this.getExtraPathForRepository(repo));
        });
        return extraPaths;
    }

    public hasExtraGradleArgs(project: string): boolean {
        const ruleSet = this.repoRules[project];
        return (!isNullOrUndefined(ruleSet) && !isNullOrUndefined(ruleSet[this.GRADLE_KEY]));
    }

    public getExtraGradleArgs(project: string): string[] | null {
        if (this.hasExtraGradleArgs(project)) {
            return this.repoRules[project][this.GRADLE_KEY];
        }
        return null;
    }

    /**
     *   Ignore Rules if they become required.
     *
     *
    public shouldIgnore(project: string, pattern?: string): boolean | string[] {
        const ruleSet = this.repoRules[project];
        if (!isNullOrUndefined(ruleSet)) {
            if (!isNullOrUndefined(ruleSet[this.IGNORE_KEY])) {
                const ignoreRules = ruleSet[this.IGNORE_KEY];
                if (!isNullOrUndefined(pattern) && pattern.trim().length > 0) {
                    if (ignoreRules.includes(pattern)) {
                        return true;
                    }
                }
                else {
                    return ignoreRules as string[];
                }
            }
            else {
                return false;
            }
        }
        return false;
    }

    */
}