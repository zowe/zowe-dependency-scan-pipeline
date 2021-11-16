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
for i in $(find . -type d -ctime +1 -name 'pax-packaging*'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /ZOWE/tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
for i in $(find . -type f -ctime +1 -name 'pax-packaging*'); do
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
echo "[${SCRIPT_NAME}] deleting ~/zowe/logs"
if [ -d ~/zowe/logs ]; then
  cd ~/zowe/logs
  for i in $(find . -type f -ctime +1); do
    if [ -n "$i" ]; then
      echo "[${SCRIPT_NAME}] - ~/zowe/logs/${i}"
      echo "rm -fr ${i}" | su
    fi
  done
fi
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /tmp/tomcat*"
cd /tmp
echo "rm -fr tomcat.*" | su
echo "rm -fr tomcat-docbase.*" | su
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /tmp/zowe-*.env"
cd /tmp
for i in $(find . -type f -ctime +1 -name 'zowe-*.env'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
echo

################################################################################
echo "[${SCRIPT_NAME}] deleting /tmp/*.jcl"
cd /tmp
for i in $(find . -type f -ctime +1 -name '*.jcl'); do
  if [ -n "$i" ]; then
    echo "[${SCRIPT_NAME}] - /tmp/${i}"
    echo "rm -fr ${i}" | su
  fi
done
echo

################################################################################
opercmd=/ZOWE/zowe-installs/opercmd.rexx
if [ -f "${opercmd}" ]; then
  echo "[${SCRIPT_NAME}] purge job queue and output"
  echo "[${SCRIPT_NAME}] - \$P JQ,DAYS>2,PROT"
  "${opercmd}" '$P JQ,DAYS>2,PROT'
  echo "[${SCRIPT_NAME}] - \$PO STC1-9999"
  "${opercmd}" '$PO STC1-9999'
  echo "[${SCRIPT_NAME}] - \$PO TSU1-9999"
  "${opercmd}" '$PO TSU1-9999'
  echo "[${SCRIPT_NAME}] - \$PO JOB1-9999"
  "${opercmd}" '$PO JOB1-9999'
  echo
fi

################################################################################
echo "[${SCRIPT_NAME}] done."
exit 0
