#!/bin/sh

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright IBM Corporation 2020
################################################################################

# Variables required on shell:
# - NODE_HOME

NODE_BIN=${NODE_HOME}/bin/node
SCRIPT_PWD=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_PWD" && cd ..
${NODE_BIN} src/app.js &
