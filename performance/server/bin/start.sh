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

if [ -z "${NODE_HOME}" ]; then
  echo "[ERROR] NODE_HOME environment variable is required to start Zowe Metrics Server."
  exit 1
fi

NODE_BIN=${NODE_HOME}/bin/node
SCRIPT_PWD=$(cd "$(dirname "$0")" && pwd)
ZMS_ROOT_DIR=$(cd "$SCRIPT_PWD" && cd .. && pwd)
# start service
echo "Starting Zowe Metrics Server >>>>>>>>>>> $NODE_BIN $ZMS_ROOT_DIR/src/app.js"
$NODE_BIN $ZMS_ROOT_DIR/src/app.js &
## debug mode
# LOG_LEVEL=debug $NODE_BIN $ZMS_ROOT_DIR/src/app.js &
## silly debug more
# LOG_LEVEL=silly $NODE_BIN $ZMS_ROOT_DIR/src/app.js &
