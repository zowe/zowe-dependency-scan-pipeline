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
# Build script
#
# - build client
# - import ui server dependency
################################################################################

# contants
SCRIPT_NAME=$(basename "$0")
BASEDIR=$(cd "$(dirname "$0")"; pwd)
PAX_WORKSPACE_DIR=.pax

cd $BASEDIR
cd ..
ROOT_DIR=$(pwd)

# prepare pax workspace
echo "[${SCRIPT_NAME}] cleaning PAX workspace ..."
rm -fr "${PAX_WORKSPACE_DIR}/content"
mkdir -p "${PAX_WORKSPACE_DIR}/content"

# copy build result to target folder
echo "[${SCRIPT_NAME}] copying build result ..."
cp LICENSE "${PAX_WORKSPACE_DIR}/content"
cp README.md "${PAX_WORKSPACE_DIR}/content"
cp package.json "${PAX_WORKSPACE_DIR}/content"
cp package-lock.json "${PAX_WORKSPACE_DIR}/content"
cp zms-server.yml "${PAX_WORKSPACE_DIR}/content"
cp -r src "${PAX_WORKSPACE_DIR}/content"
cp -r configs "${PAX_WORKSPACE_DIR}/content"

echo "[${SCRIPT_NAME}] install npm packages ..."
cd "${PAX_WORKSPACE_DIR}/content"
npm install --production
cd "${ROOT_DIR}"

# move content to another folder
rm -fr "${PAX_WORKSPACE_DIR}/ascii"
mkdir -p "${PAX_WORKSPACE_DIR}/ascii"
rsync -rv \
  --exclude '*.png' --exclude '*.ico' \
  --exclude '*.zip' --exclude '*.pax' \
  --exclude '*.tgz' --exclude '*.tar.gz' \
  --prune-empty-dirs --remove-source-files \
  "${PAX_WORKSPACE_DIR}/content/" \
  "${PAX_WORKSPACE_DIR}/ascii"

echo "[${SCRIPT_NAME}] ${PAX_WORKSPACE_DIR} folder is prepared."
exit 0
