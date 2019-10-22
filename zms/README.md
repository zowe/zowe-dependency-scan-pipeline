
# Game of Toronto

# ZMS-SERVER 
A open source monitoring adapter, hosted behind API mediation layer on zowe.

`https://my.mainframe.com:7554/api/v1/metrics/`     

## Open Metrics
`/metrics` endpoint serves metrics based on standard [Open Metrics](https://openmetrics.io/), which is an open standard for transmitting metrics at scale, with support for both text representation and Protocol Buffers.

## Modern monitoring tools
We used two very commonly used metric & log storage tools to build this demo. 
They are most modern tools used for visualizing and analyzing metrics and logs data

1) Prometheus + Grafna
2) Elasticsearch, Logstash & Kibana (ELK stack)

## ZMS Architecture

1) `/metrics` rest API endpoint to serve metrics in open standard format
2) Each metric is calculated using *rexx or jcl scripts*, it extracts real time metrics like CPU, memory, paging etc from Z server, and transforms it to easily consumable json format
3) *Logs* are pushed in same way as metrics, it just needs to be pointed to location of log path, customized parser can be added in configuration to handle encoding etc if needed.
3) *Scheduler* - it takes care of running metrics via worker thread and returning result to metrics and log manager
4) ZMS is extensible and *config* driven, you can add your own customs metrics and scripts
5) `/metrics` endpoint & logs are consumed by `ELK` stack. The ELK stack consists of Elasticsearch, Logstash, and Kibana. Although they've all been built to work exceptionally well together, each one is an individual project run by the open-source company Elastic

## Why we need ZMS?
Basic idea behind ZMS, it acts as bridge between metrics collection & modern monitoring tools stack like ELK.
It act as extensible adapter, where we can plugin metrics, and various logs we have on system, and ZMS will help export it to external stack like ELK

## Advantage of adopting modern monitoring tools
- System administrators can bring their own dashboard, like developers can bring their own code editors
- Last twenty years we have seen a large amount of work being done in visualization & monitoring tools space, we want a way to communicate to these popular tools
- Historical metrics & logs can be leveraged as a training data to do machine learning in coming up with complex alerting rules.
