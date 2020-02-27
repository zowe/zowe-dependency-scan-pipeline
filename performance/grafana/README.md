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

Visit `http://localhost:3030` to access Grafana.

## Import Zowe Metrics Dashboard

- From Grafana UI, click on `+` icon on the left, then choose `Import`.
- Click on `Upload` and select `zowe-metrics-dashboard.json` from local computer.
- Name the dashboard and save.
