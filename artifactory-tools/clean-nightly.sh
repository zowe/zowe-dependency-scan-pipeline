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
# This script cleans up nightly builds.
# 
# Example: ./clean-nightly.sh -a artifactory-server repo/path/to/nightly/
################################################################################

################################################################################
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_PWD=$(cd $(dirname "$0") && pwd)
RUN_PWD=$(pwd)
DEFAULT_ARTIFACTORY_SERVER=zowe-jack
DEFAULT_NIGHTLY_BUILD_FULL_PATH=libs-release-local/org/zowe/nightly/
NIGHTLY_BUILD_PATTERNS="zowe-*.pax zowe-smpe-*.tar AZWE001.readme-*.txt AZWE001-*.pax.Z cli/zowe-cli-*.zip"
NIGHTLY_BUILD_COUNT=30

################################################################################
# variables
ARTIFACTORY_SERVER=$DEFAULT_ARTIFACTORY_SERVER
NIGHTLY_BUILD_FULL_PATH=$DEFAULT_NIGHTLY_BUILD_FULL_PATH

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
shift $((OPTIND-1))
NIGHTLY_BUILD_FULL_PATH=$1
if [ -z "${NIGHTLY_BUILD_FULL_PATH}" ]; then
  NIGHTLY_BUILD_FULL_PATH=$DEFAULT_NIGHTLY_BUILD_FULL_PATH
fi
NIGHTLY_BUILD_REPO=$(echo $NIGHTLY_BUILD_FULL_PATH | sed -e 's#^\([^/]\{1,\}\)/\(.\{1,\}\)#\1#')
NIGHTLY_BUILD_PATH=$(echo $NIGHTLY_BUILD_FULL_PATH | sed -e 's#^\([^/]\{1,\}\)/\(.\{1,\}\)#\2#')

################################################################################
# essential validations
if [ -z "$NIGHTLY_BUILD_FULL_PATH" ]; then
  echo "[${SCRIPT_NAME}][error] path is required."
  exit 1
fi
if [ -z "$NIGHTLY_BUILD_REPO" ]; then
  echo "[${SCRIPT_NAME}][error] couldn't find repository from path."
  exit 1
fi
if [ -z "$NIGHTLY_BUILD_PATH" ]; then
  echo "[${SCRIPT_NAME}][error] couldn't find artifact path from path."
  exit 1
fi

################################################################################
echo "[${SCRIPT_NAME}] Cleaning $NIGHTLY_BUILD_FULL_PATH on ${ARTIFACTORY_SERVER} ..."
echo

################################################################################
for pattern in $NIGHTLY_BUILD_PATTERNS; do
  echo "[${SCRIPT_NAME}] Checking $NIGHTLY_BUILD_FULL_PATH$pattern ..."
  ARTIFACTS="$(jfrog rt s --server-id "${ARTIFACTORY_SERVER}" --sort-by created "${NIGHTLY_BUILD_FULL_PATH}${pattern}" | jq -r '.[].path')"
  echo -e "$ARTIFACTS"
  echo
  ARTIFACTS_COUNT=$(echo -e "$ARTIFACTS" | wc -l)
  if [ $ARTIFACTS_COUNT -gt $NIGHTLY_BUILD_COUNT ]; then
    SHOULD_DELETE_COUNT="$(($ARTIFACTS_COUNT-$NIGHTLY_BUILD_COUNT))"
    echo "[${SCRIPT_NAME}] Will delete ${SHOULD_DELETE_COUNT} artifact(s) ..."
    SHOULD_DELETE="$(echo -e "$ARTIFACTS" | head -n ${SHOULD_DELETE_COUNT})"
    for one in $SHOULD_DELETE; do
      echo "[${SCRIPT_NAME}] - ${one} ..."
      jfrog rt del --server-id "${ARTIFACTORY_SERVER}" --quiet "${one}"
      sleep 0.3
    done
  else
    echo "[${SCRIPT_NAME}] no need to clean"
  fi
  echo
done

################################################################################
echo
echo "[${SCRIPT_NAME}] done."
exit 0
