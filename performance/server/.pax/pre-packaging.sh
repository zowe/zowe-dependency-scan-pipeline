#!/bin/bash -e

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright IBM Corporation 2019, 2020
################################################################################

################################################################################
# Build script
################################################################################

# contants
SCRIPT_NAME=$(basename "$0")
BASEDIR=$(cd "$(dirname "$0")"; pwd)

echo "[${SCRIPT_NAME}] chmod +x to *.rexx"
cd content
chmod a+x src/collectors/metrics/*.rexx
# check result
ls -l src/collectors/metrics
