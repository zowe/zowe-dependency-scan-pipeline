import { ZoweManifestBinaryDependency } from "./ZoweManifestBinaryDependency";
import { ZoweManifestSourceDependency } from "./ZoweManifestSourceDependency";

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


export type ZoweManifest = {
    __meta__: {
        name: string,
        version: string,
        description: string,
        license: string,
        homepage: string,
        build: {
            branch: string,
            number: string,
            commitHash: string,
            timestamp: string
        }
    },
    binaryDependencies: {
        entries: ZoweManifestBinaryDependency
    },
    sourceDependencies: [
        ZoweManifestSourceDependency
    ],
    dependencyDecisions: {
        rel: string
    }
};
