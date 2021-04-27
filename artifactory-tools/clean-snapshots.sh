#!/bin/bash -e

################################################################################
# This program and the accompanying materials are made available under the terms of the
# Eclipse Public License v2.0 which accompanies this distribution, and is available at
# https://www.eclipse.org/legal/epl-v20.html
#
# SPDX-License-Identifier: EPL-2.0
#
# Copyright IBM Corporation 2018, 2019
################################################################################

################################################################################
# This script cleans up expired snapshots builds.
# 
# Example: ./clean-nightly.sh -a artifactory-server
################################################################################

################################################################################
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_PWD=$(cd $(dirname "$0") && pwd)
RUN_PWD=$(pwd)
DEFAULT_ARTIFACTORY_SERVER=zowe-jack
OS_CATEGORY=$(uname)
SNAPSHOT_BUILD_PATH_LIST=snapshots-paths.txt
SNAPSHOT_BUILD_KEEP_PATTERN="^[0-9]+\.[0-9]+\.[0-9]+-(STAGING|SNAPSHOT|SNAPSHOTS|RC)\$"
SNAPSHOT_BUILD_KEEP_DAYS=30

################################################################################
# variables
ARTIFACTORY_SERVER=$DEFAULT_ARTIFACTORY_SERVER
# 2019-06-07T14:57:10.657+0000
if [ "${OS_CATEGORY}" = "Darwin" ]; then
  TIMESTAMP_LASTMODIFIED=$(date -"v-${SNAPSHOT_BUILD_KEEP_DAYS}d" +%Y-%m-%dT%H:%M:%S.000+0000)
else
  TIMESTAMP_LASTMODIFIED=$(date +%Y-%m-%dT%H:%M:%S.000+0000 -d "${SNAPSHOT_BUILD_KEEP_DAYS} days ago")
fi

# allow to exit by ctrl+c
function finish {
  echo "[${SCRIPT_NAME}] interrupted"
  exit 1
}
trap finish SIGINT

################################################################################
# parse parameters
function usage {
  echo "Clean nightly builds on jFrog Artifactories."
  echo
  echo "Usage: $SCRIPT_NAME [OPTIONS] <path>"
  echo
  echo "Options:"
  echo "  -h  Display this help message."
  echo "  -a  Artifactory server id. Optional, default is $DEFAULT_ARTIFACTORY_SERVER."
  echo
}
while getopts ":ha:" opt; do
  case $opt in
    h)
      usage
      exit 0
      ;;
    a)
      ARTIFACTORY_SERVER=$OPTARG
      ;;
    \?)
      echo "[${SCRIPT_NAME}][error] invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "[${SCRIPT_NAME}][error] invalid option argument: -$OPTARG requires an argument" >&2
      exit 1
      ;;
  esac
done

################################################################################
# essential validations

################################################################################
echo "[${SCRIPT_NAME}] Cleaning snapshots on ${ARTIFACTORY_SERVER} ..."
echo "[${SCRIPT_NAME}] - artifact(s) before ${TIMESTAMP_LASTMODIFIED} will be deleted."
echo

################################################################################
for pattern in $(cat "${SCRIPT_PWD}/${SNAPSHOT_BUILD_PATH_LIST}"); do
  echo "[${SCRIPT_NAME}] Checking $pattern ..."
  SUBFOLDERS="$(jfrog rt curl --server-id "${ARTIFACTORY_SERVER}" --silent -XGET "/api/storage/${pattern}" | jq -r '.children[] | select(.folder == true) | select(.uri|test("/[0-9]+.[0-9]+.[0-9]+-")) | .uri | .[1:]')"
  for folder in $SUBFOLDERS; do
    if [[ $folder =~ $SNAPSHOT_BUILD_KEEP_PATTERN ]]; then
      echo "[${SCRIPT_NAME}] - ${folder} ==> keep"
    else
      LAST_MODIFIED="$(jfrog rt curl --server-id "${ARTIFACTORY_SERVER}" --silent -XGET /api/storage/${pattern}${folder}?lastModified |  jq -r '.lastModified')"
      if [ "${LAST_MODIFIED}" = "null" ]; then
        echo "[${SCRIPT_NAME}] - ${folder} (empty) deleting ..."
        if jfrog rt curl --server-id "${ARTIFACTORY_SERVER}" -XDELETE "/${pattern}${folder}"; then
          echo "[${SCRIPT_NAME}]                   success"
        else
          echo "[${SCRIPT_NAME}]                   failed"
        fi
        sleep 0.3
      elif [[ $LAST_MODIFIED > $TIMESTAMP_LASTMODIFIED ]]; then
        echo "[${SCRIPT_NAME}] - ${folder} (${LAST_MODIFIED}) ==> keep"
      else
        echo "[${SCRIPT_NAME}] - ${folder} (${LAST_MODIFIED}) deleting ..."
        if jfrog rt curl --server-id "${ARTIFACTORY_SERVER}" -XDELETE "/${pattern}${folder}"; then
          echo "[${SCRIPT_NAME}]                   success"
        else
          echo "[${SCRIPT_NAME}]                   failed"
        fi
        sleep 0.3
      fi
    fi
  done
  echo
done

################################################################################
echo
echo "[${SCRIPT_NAME}] done."
exit 0
