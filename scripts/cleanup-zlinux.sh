#!/bin/sh

################################################################################
# This program and the accompanying materials are
# made available under the terms of the Eclipse Public License v2.0 which accompanies
# this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright Contributors to the Zowe Project.
################################################################################

################################################################################
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_PWD=$(cd $(dirname "$0") && pwd)

################################################################################
echo "[${SCRIPT_NAME}] df"
df -k
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting ~/build-*"
rm -fr ~/build-*
echo

################################################################################
echo "[${SCRIPT_NAME}] prune docker"
sudo docker image prune -f -a
sudo docker system prune -f
echo

################################################################################
echo "[${SCRIPT_NAME}] done."
exit 0
