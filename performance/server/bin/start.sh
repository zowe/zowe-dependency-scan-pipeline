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
# - NODE_HOME or NVM_BIN

NODE_BIN=
if [ ! -z "${NODE_HOME}" ]; then
  NODE_BIN=${NODE_HOME}/bin/node
elif [ ! -z "${NVM_BIN}" ]; then
  NODE_BIN=${NVM_BIN}/node
fi

if [ -z "${NODE_BIN}" ]; then
  echo "[ERROR] NODE_HOME or NVM_BIN environment variable is required to start Zowe Metrics Server."
  exit 1
fi

SCRIPT_PWD=$(cd "$(dirname "$0")" && pwd)
ZMS_ROOT_DIR=$(cd "$SCRIPT_PWD" && cd .. && pwd)
# start service
echo "Starting Zowe Metrics Server >>>>>>>>>>> $NODE_BIN $ZMS_ROOT_DIR/dist/app.js"
$NODE_BIN $ZMS_ROOT_DIR/dist/app.js
## debug mode
# LOG_LEVEL=debug $NODE_BIN $ZMS_ROOT_DIR/dist/app.js
## silly debug more
# LOG_LEVEL=silly $NODE_BIN $ZMS_ROOT_DIR/dist/app.js
