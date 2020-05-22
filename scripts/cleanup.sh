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
echo "[${SCRIPT_NAME}] deleting /ZOWE/tmp/zowe-packaging*"
cd /ZOWE/tmp
for i in $(find . -type d -ctime +1 -name 'zowe-packaging*'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /ZOWE/tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
for i in $(find . -type f -ctime +1 -name 'zowe-packaging*'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /ZOWE/tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
# SMPE cannot handle lower case directory
cd /ZOWE/TMP
for i in $(find . -type d -ctime +1 -name 'ZOWE-PACKAGING*'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /ZOWE/TMP/${i}"
    echo "rm -fr ${i}" | su
  fi
done
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /ZOWE/tmp/~jenkins*"
cd /ZOWE/tmp
for i in $(find . -type d -ctime +1 -name '~jenkins*'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /ZOWE/tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /tmp/tomcat*"
cd /tmp
echo "rm -fr tomcat.*" | su
echo

################################################################################
echo "[${SCRIPT_NAME}] done."
exit 0
