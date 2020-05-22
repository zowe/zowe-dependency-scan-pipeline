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
# This script sync artifacts between two jFrog Artifactory
# 
# Example: ./sync.sh -f artifactory-a -t artifactory-b repo/path/to/artifacts/
################################################################################

################################################################################
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_PWD=$(cd $(dirname "$0") && pwd)
RUN_PWD=$(pwd)
DEFAULT_ARTIFACTORY_ORIGINAL=gizaartifactory
DEFAULT_ARTIFACTORY_TARGET=zowe
TMP_FOLDER=.artifactory-sync

################################################################################
# variables
ARTIFACTORY_ORIGINAL=$DEFAULT_ARTIFACTORY_ORIGINAL
ARTIFACTORY_TARGET=$DEFAULT_ARTIFACTORY_TARGET
ARTIFACTORY_FULL_PATH=

# allow to exit by ctrl+c
function finish {
  echo "[${SCRIPT_NAME}] interrupted"
  exit 1
}
trap finish SIGINT

################################################################################
# parse parameters
function usage {
  echo "Synchronize artifacts between two jFrog Artifactories."
  echo
  echo "Usage: $SCRIPT_NAME [OPTIONS] <path>"
  echo
  echo "Options:"
  echo "  -h  Display this help message."
  echo "  -f  Original artifactory. Optional, default is $DEFAULT_ARTIFACTORY_ORIGINAL."
  echo "  -t  Target artifactory. Optional, default is $DEFAULT_ARTIFACTORY_TARGET."
  echo
}
while getopts ":hf:t:" opt; do
  case $opt in
    h)
      usage
      exit 0
      ;;
    f)
      ARTIFACTORY_ORIGINAL=$OPTARG
      ;;
    t)
      ARTIFACTORY_TARGET=$OPTARG
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
ARTIFACTORY_FULL_PATH=$1
ARTIFACTORY_REPO=$(echo $ARTIFACTORY_FULL_PATH | sed -e 's#^\([^/]\{1,\}\)/\(.\{1,\}\)#\1#')
ARTIFACTORY_PATH=$(echo $ARTIFACTORY_FULL_PATH | sed -e 's#^\([^/]\{1,\}\)/\(.\{1,\}\)#\2#')

################################################################################
# essential validations
if [ -z "$ARTIFACTORY_FULL_PATH" ]; then
  echo "[${SCRIPT_NAME}][error] path is required."
  exit 1
fi
if [ -z "$ARTIFACTORY_REPO" ]; then
  echo "[${SCRIPT_NAME}][error] couldn't find repository from path."
  exit 1
fi
if [ -z "$ARTIFACTORY_PATH" ]; then
  echo "[${SCRIPT_NAME}][error] couldn't find artifact path from path."
  exit 1
fi

################################################################################
echo "[${SCRIPT_NAME}] Syncing $ARTIFACTORY_FULL_PATH from ${ARTIFACTORY_ORIGINAL} to ${ARTIFACTORY_TARGET} ..."
echo

################################################################################
# prepare temp folder 
rm -fr "${TMP_FOLDER}"
mkdir -p "${TMP_FOLDER}"
cd "${TMP_FOLDER}"

################################################################################
echo "[${SCRIPT_NAME}] Downloading artifacts ..."
jfrog rt dl --server-id "${ARTIFACTORY_ORIGINAL}" "${ARTIFACTORY_FULL_PATH}"
echo

################################################################################
echo "[${SCRIPT_NAME}] Check target files ..."
TARGET_EXISTS="$(jfrog rt s --server-id "${ARTIFACTORY_TARGET}" "${ARTIFACTORY_FULL_PATH}" | jq -r '.[].path' | sed -e 's#[^/]\{1,\}/##')"
echo "[${SCRIPT_NAME}] found $(echo "${TARGET_EXISTS}" | wc -l) file(s), deleting from downloaded to avoid overwritten ..."
for f in $TARGET_EXISTS; do
  echo "[${SCRIPT_NAME}] - ${f}"
  rm -f "${f}"
done
echo

################################################################################
echo "[${SCRIPT_NAME}] Uploading artifacts ..."
jfrog rt u --server-id "${ARTIFACTORY_TARGET}" \
  --recursive --include-dirs=true --flat=false \
  ./ "${ARTIFACTORY_REPO}/"
echo

################################################################################
echo
echo "[${SCRIPT_NAME}] done."
exit 0
