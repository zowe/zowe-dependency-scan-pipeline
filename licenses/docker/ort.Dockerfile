# Set base image as Debian Buster w/ Packaged Ruby
FROM debian:bullseye

#####################################################
# version the Dockerfile, so we can do release bump
LABEL version="1.0.0"
ARG ORT_VERSION=12.0.0

USER root

RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y curl bash python3 zip unzip wget software-properties-common
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update -y && apt-get install -y nodejs openjdk-17-jdk pkg-config

RUN	mkdir /report
RUN mkdir -p /home/build

ENV HOME=/root

WORKDIR /home/build

RUN mkdir -p "$HOME/.npm_global"
ENV NPM_CONFIG_PREFIX="$HOME/.npm-global"
ENV PATH=$PATH:"$HOME/.npm-global/bin"
ENV PATH="$HOME/.cargo/bin:$PATH"

RUN npm install -g yarn

ENV owasp_version=5.3.2
ENV owasp_dc_download="https://github.com/jeremylong/DependencyCheck/releases/download/v${owasp_version}/"

RUN file="dependency-check-${owasp_version}-release.zip"                        && \
    wget "$owasp_dc_download/$file"                                             && \
    unzip ${file}                                                           	&& \
    rm ${file}          

WORKDIR /home/build

RUN curl -fL https://getcli.jfrog.io/v2 | sh && chmod 775 jfrog && mv jfrog /usr/local/bin


RUN apt-get install libssl-dev build-essential jq -y

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
RUN . "$HOME/.cargo/env"
RUN env

RUN rustup install stable && rustup default stable
RUN cargo install cargo-license
RUN cargo install get-license-helper

RUN wget  -O ort.zip "https://github.com/oss-review-toolkit/ort/releases/download/$ORT_VERSION/ort-$ORT_VERSION.zip"
RUN unzip ort.zip
ENV PATH=/home/build/ort-$ORT_VERSION/bin:$PATH

WORKDIR /home/build

ENTRYPOINT [ "tail", "-f", "/dev/null" ]

