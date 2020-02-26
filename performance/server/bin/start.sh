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
# SCRIPT_PWD=$(cd "$(dirname "$0")" && pwd)
# get component directory
SERVER_DIR="${ROOT_DIR}/components/zms"
# start service
echo "Starting Zowe Metrics Server >>>>>>>>>>> $NODE_BIN $SERVER_DIR/src/app.js"
$NODE_BIN $SERVER_DIR/src/app.js
