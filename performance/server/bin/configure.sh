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

echo "Configuring Zowe Metrics Server ..."

# Add static definition for zms
cat <<EOF >${STATIC_DEF_CONFIG_DIR}/zms.ebcidic.yml
#
services:
- serviceId: zowe-metric-server
  title: Zowe Metric Server
  description: A metrics collecting service running on z/OS.
  catalogUiTileId: zowe-metric-server
  instanceBaseUrls:
  - https://${ZOWE_EXPLORER_HOST}:19000
  homePageRelativeUrl: "/"
  healthCheckRelativeUrl: "/"
  routedServices:
  - gatewayUrl: api/v1  # [api/ui/ws]/v{majorVersion}
    serviceRelativeUrl:
  apiInfo:
  - apiId: org.zowe.metric-server
    gatewayUrl: api/v1
    version: 0.5.0

catalogUiTiles:
  zowe-metric-server:
    title: zowe-metric-server
    description: A metrics collecting service running on z/OS.
EOF
iconv -f IBM-1047 -t IBM-850 ${STATIC_DEF_CONFIG_DIR}/zms.ebcidic.yml > $STATIC_DEF_CONFIG_DIR/zms.yml
rm ${STATIC_DEF_CONFIG_DIR}/zms.ebcidic.yml
chmod 770 $STATIC_DEF_CONFIG_DIR/zms.yml
echo ">>>>>>>>>> zms api def >>>>>>>>>>"
iconv -f IBM-850 -t IBM-1047 $STATIC_DEF_CONFIG_DIR/zms.yml
echo "<<<<<<<<<< zms api def <<<<<<<<<<"
