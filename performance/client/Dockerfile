FROM node:12.18.3-alpine

#####################################################
# version the Dockerfile
# when building with automation, this value will be replaced with the version
# defined in package.json
LABEL version="0.0.1"

#####################################################
# install docker
RUN apk add --update docker

#####################################################
# define working directory
WORKDIR /app
RUN mkdir -p .tmp

# prepare dependencies
COPY package*.json ./
RUN npm install --no-audit

# build app
COPY . .
RUN npm run build

#####################################################
# start command
ENTRYPOINT ["npm", "test"]
