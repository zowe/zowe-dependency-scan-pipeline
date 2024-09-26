FROM node:10-alpine

#####################################################
# version the Dockerfile
# when building with automation, this value will be replaced with the version
# defined in package.json
LABEL version="0.0.1"

#####################################################
# prepare environment
ENV NODE_HOME=/usr/local
EXPOSE 19000
EXPOSE 19001

#####################################################
# prepare folder
RUN mkdir -p /app/src
WORKDIR /app

#####################################################
# copy less likely changed files to target folder
COPY LICENSE .
COPY README.md .
COPY tsconfig.json .
COPY bin bin
COPY configs configs
# overwrite rmfdds as default config
RUN cp configs/rmfdds-only.yaml configs/index.yaml
COPY package.json .
COPY package-lock.json .
COPY src src

#####################################################
# build and copy build result
RUN npm install --no-audit --no-fund && npm run build

#####################################################
# upload everything not required for production
RUN rm -fr node_modules \
    && chmod a+x bin/*.sh \
    && rm tsconfig.json \
    && rm -fr bin/configure.sh \
    && rm -fr src \
    && npm install --production

#####################################################
# start command
CMD ["bin/start.sh"]
