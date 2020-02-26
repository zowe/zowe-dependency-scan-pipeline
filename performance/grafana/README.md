# Visualize Zowe Metrics with Grafana/Prometheus

## Prerequisites

You need `docker-compose` - checkout the [install guide](https://docs.docker.com/compose/install/)

## Update Configs

- Edit `grafana/prometheus/prometheus.yml`:
  - replace `<server-host>` with your server host name where runs `Zowe Metrics Server`.

## Usage

```
$ docker-compose run -d
```
