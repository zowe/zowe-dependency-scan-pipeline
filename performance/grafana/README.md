# Visualize Zowe Metrics with Grafana/Prometheus

## Prerequisites

You need `docker-compose` - checkout the [install guide](https://docs.docker.com/compose/install/)

There are two ways to start the services.

## Default mode: Grafana and Prometheus only

### Update Configs

- Edit `grafana/prometheus/prometheus.yml`:
  - replace `<server-host>` with your server host name where runs `Zowe Metrics Server`.

### Usage

```
$ docker-compose up -d
```

Visit `http://localhost:3000` to access Grafana. Default user name and password are defined in `performance/grafana/docker-compose.yml`.

To shutdown, use `docker-compose down` command.

## Advanced mode: Grafana, Prometheus and Zowe Metrics Server

### Update Configs

- Edit `grafana/docker-compose-zms.yml`:
  - replace `RMF_DDS_*` variable values to match your RMF-DDS server.
- Edit `grafana/prometheus/prometheus.yml`:
  - make sure `static_configs.[0].targets` is `['zms:19000']`.

### Usage

```
$ docker-compose -f docker-compose-zms.yml up -d
```

Visit `http://localhost:3000` to access Grafana. Default user name and password are defined in `performance/grafana/docker-compose.yml`. Visit `http://localhost:19001/metrics` to access Zowe Metrics Server.

To shutdown, use `docker-compose -f docker-compose-zms.yml down` command.

## Create default data source

- From Grafana UI, click on `Configuration` - `Data Source` section.
- Choose `Add data source` and select `Prometheus`.
- Input `http://prometheus:9090` as URL, input `10s` as `Scrape interval` and save.
- For the new data source, we can import default Prometheus dashboard by selecting the `Dashboard` tab, choosing `Prometheus 2.0 Stats` and clicking on `Import`.

## Import Zowe Metrics Dashboard

- From Grafana UI, click on `+` icon on the left, then choose `Import`.
- Click on `Upload` and select `zowe-metrics-dashboard.json` from local computer.
- Name the dashboard and save.
