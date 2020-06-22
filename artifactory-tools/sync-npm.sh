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
# Example: ./sync.sh -f registry-a -t registry-b my-npm-package
################################################################################

################################################################################
# constants
SCRIPT_NAME=$(basename "$0")
SCRIPT_PWD=$(cd $(dirname "$0") && pwd)
RUN_PWD=$(pwd)
DEFAULT_NPM_REGISTRY_ORIGINAL=gizaartifactory
DEFAULT_NPM_REGISTRY_TARGET=zowe
DEFAULT_NPM_REPOSITORY=npm-local-release
TMP_FOLDER=.npm-sync

################################################################################
# variables
NPM_REGISTRY_ORIGINAL=$DEFAULT_NPM_REGISTRY_ORIGINAL
NPM_REGISTRY_TARGET=$DEFAULT_NPM_REGISTRY_TARGET
NPM_REPOSITORY=$DEFAULT_NPM_REPOSITORY
NPM_REGISTRY=
NPM_PACKAGE=
NPM_SCOPE=

# allow to exit by ctrl+c
function finish {
  echo "[${SCRIPT_NAME}] interrupted"
  exit 1
}
trap finish SIGINT

################################################################################
# parse parameters
function usage {
  echo "Synchronize npm package between two jFrog Artifactory NPM Registries."
  echo
  echo "Usage: $SCRIPT_NAME [OPTIONS] <package>"
  echo
  echo "Options:"
  echo "  -h  Display this help message."
  echo "  -f  Original npm registry. Optional, default is $NPM_REGISTRY_ORIGINAL."
  echo "  -t  Target npm registry. Optional, default is $NPM_REGISTRY_TARGET."
  echo "  -r  Repository name. Optional, default is $DEFAULT_NPM_REPOSITORY."
  echo
}
while getopts ":hf:t:r:" opt; do
  case $opt in
    h)
      usage
      exit 0
      ;;
    f)
      NPM_REGISTRY_ORIGINAL=$OPTARG
      ;;
    t)
      NPM_REGISTRY_TARGET=$OPTARG
      ;;
    r)
      NPM_REPOSITORY=$OPTARG
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
NPM_PACKAGE=$1
if [[ $NPM_PACKAGE =~ @.+/.+ ]]; then
  NPM_SCOPE=$(echo "$NPM_PACKAGE" | awk -F'/' '{print $1};' | cut -c 2-)
fi

################################################################################
# essential validations
if [ -z "$NPM_PACKAGE" ]; then
  echo "[${SCRIPT_NAME}][error] package is required."
  exit 1
fi
NPM_REPOSITORY_URL="$(jfrog rt curl --server-id "${NPM_REGISTRY_TARGET}" --silent -XGET /api/repositories | jq -r ".[] | select(.key == \"${NPM_REPOSITORY}\") | .url")"
if [[ $NPM_REPOSITORY_URL =~ https:// ]]; then
  # NPM_REPOSITORY_URL is in format of https://zowe.jfrog.io/zowe/npm-local-release
  # convert to https://zowe.jfrog.io/zowe/api/npm/npm-local-release
  NPM_REGISTRY="$(echo "${NPM_REPOSITORY_URL}" | sed -e "s#\(/${NPM_REPOSITORY}\)#/api/npm\1#")"
else
  echo "[${SCRIPT_NAME}][error] cannot find url of ${NPM_REPOSITORY}."
  exit 1
fi
if [ -z "$NPM_REGISTRY" ]; then
  echo "[${SCRIPT_NAME}][error] cannot determin npm registry."
  exit 1
fi

################################################################################
echo "[${SCRIPT_NAME}] Syncing $NPM_REPOSITORY($NPM_PACKAGE) from ${NPM_REGISTRY_ORIGINAL} to ${NPM_REGISTRY_TARGET} ..."
echo

################################################################################
# prepare temp folder 
rm -fr "${TMP_FOLDER}"
mkdir -p "${TMP_FOLDER}"
cd "${TMP_FOLDER}"

################################################################################
echo "[${SCRIPT_NAME}] Downloading package.json ..."
jfrog rt curl --server-id "${NPM_REGISTRY_ORIGINAL}" --silent -XGET "/${NPM_REPOSITORY}/.npm/${NPM_PACKAGE}/package.json" > original.json
ERROR_ORIGINAL="$(cat original.json | jq -r '.errors[0].message')"
if [ "${ERROR_ORIGINAL}" != "null" ]; then
  echo "[${SCRIPT_NAME}][error] download original package.json failed: ${ERROR_ORIGINAL}"
  echo
  exit 1
fi
jfrog rt curl --server-id "${NPM_REGISTRY_TARGET}" --silent -XGET "/${NPM_REPOSITORY}/.npm/${NPM_PACKAGE}/package.json" > target.json
ERROR_TARGET="$(cat target.json | jq -r '.errors[0].message')"
if [ "${ERROR_TARGET}" != "null" ]; then
  rm target.json
fi
echo

################################################################################
echo "[${SCRIPT_NAME}] Checking versions ..."
cat original.json | jq -r '.time | to_entries | sort_by(.value) | .[] | select(.key|test("^[0-9]+.[0-9]+.[0-9]+")) | .key' > original.versions
echo "[${SCRIPT_NAME}] - original has $(cat original.versions | wc -l) versions"
if [ -f target.json ]; then
  cat target.json | jq -r '.time | to_entries | sort_by(.value) | .[] | select(.key|test("^[0-9]+.[0-9]+.[0-9]+")) | .key' > target.versions
else
  touch target.versions
fi
echo "[${SCRIPT_NAME}] - target has $(cat target.versions | wc -l) versions"
echo

################################################################################
echo "[${SCRIPT_NAME}] Syncing packages ..."
for ver in $(cat original.versions); do
  echo "[${SCRIPT_NAME}] - ${ver} >>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
  IN_TARGET="$(cat target.versions | sed -e 's#\(.*\)#<\1>#' | grep -F "<$ver>" || true)"
  if [ -z "${IN_TARGET}" ]; then
    jfrog rt dl --server-id "${NPM_REGISTRY_ORIGINAL}" --flat=false "${NPM_REPOSITORY}/${NPM_PACKAGE}/-/${NPM_PACKAGE}-${ver}.tgz"
    echo "[${SCRIPT_NAME}]                                       downloaded"
    jfrog rt u --server-id "${NPM_REGISTRY_TARGET}" --flat=false "${NPM_PACKAGE}/-/${NPM_PACKAGE}-${ver}.tgz" "${NPM_REPOSITORY}/"
    echo "[${SCRIPT_NAME}]                                       uploaded"
  else
    echo "[${SCRIPT_NAME}]                                       exists, skipped"
  fi
done
echo

################################################################################
echo "[${SCRIPT_NAME}] Syncing tags ..."
DIST_TAGS_ORIGINAL=$(cat original.json | jq -r '."dist-tags" | to_entries | .[].key')
if [ ! -f ~/.npmrc ]; then
  touch ~/.npmrc
fi
cp ~/.npmrc ~/.npmrc-npm-sync-bak
# npm config set registry https://zowe.jfrog.io/zowe/api/npm/npm-local-release/
NPMRC="$(jfrog rt curl --server-id "${NPM_REGISTRY_TARGET}" --silent -XGET /api/npm/auth)"
echo "$NPMRC" > ~/.npmrc
if [ -n "${NPM_SCOPE}" ]; then
  NPMRC="$(jfrog rt curl --server-id "${NPM_REGISTRY_TARGET}" --silent -XGET "/api/npm/${NPM_REPOSITORY}/auth/${NPM_SCOPE}")"
  # npm config set registry already included
  echo "$NPMRC" >> ~/.npmrc
else
  npm config set registry $NPM_REGISTRY
fi
# cat ~/.npmrc
for tag in $DIST_TAGS_ORIGINAL; do
  echo -n "[${SCRIPT_NAME}] - ${tag}: "
  IN_ORIGINAL="$(cat original.json | jq -r ".\"dist-tags\".\"${tag}\"")"
  IN_TARGET="$(cat target.json | jq -r ".\"dist-tags\".\"${tag}\"")"
  echo "${IN_ORIGINAL} <-> ${IN_TARGET}"
  if [ "${IN_ORIGINAL}" == "${IN_TARGET}" ]; then
    echo "[${SCRIPT_NAME}]                                       same, skipped"
  elif [ "${IN_TARGET}" = "null" ]; then
    echo "[${SCRIPT_NAME}]                                       added"
    npm dist-tag add "${NPM_PACKAGE}@${IN_ORIGINAL}" "${tag}"
  else
    echo "[${SCRIPT_NAME}]                                       updated"
    npm dist-tag rm "${NPM_PACKAGE}" "${tag}"
    npm dist-tag add "${NPM_PACKAGE}@${IN_ORIGINAL}" "${tag}"
  fi
done
cp ~/.npmrc-npm-sync-bak ~/.npmrc
echo

################################################################################
echo "[${SCRIPT_NAME}] done."
exit 0
