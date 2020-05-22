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
items=\$(find . -type d -ctime +1 -name 'zowe-packaging*')
for i in "\$items"; do
  echo "- \${i}"
  echo "rm -fr \${i}" | su
done
items=\$(find . -type f -ctime +1 -name 'zowe-packaging*')
for i in "\$items"; do
  echo "- \${i}"
  echo "rm -fr \${i}" | su
done
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /ZOWE/tmp/~jenkins*"
cd /ZOWE/tmp
items=\$(find . -type d -ctime +1 -name '~jenkins*')
for i in "\$items"; do
  echo "- \${i}"
  echo "rm -fr \${i}" | su
done
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /tmp/tomcat*"
cd /tmp
echo "rm -fr tomcat.*" | su
echo

################################################################################
echo
echo "[${SCRIPT_NAME}] done."
exit 0
