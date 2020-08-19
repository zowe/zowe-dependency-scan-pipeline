#!/bin/sh

cat << EOF
[
{"key":"REAL","process":"*MASTER*","value": 1161},
{"key":"PAGING","process":"*MASTER*","value": 0.00},
{"key":"CPUPR","process":"*MASTER*","value": 0.00},
{"key":"CPU","process":"*MASTER*","value": 11.27},
{"key":"REAL","process":"PCAUTH","value": 90},
{"key":"PAGING","process":"PCAUTH","value": 0.00},
{"key":"CPUPR","process":"PCAUTH","value": 0.00},
{"key":"CPU","process":"PCAUTH","value": 0.00},
{"key":"REAL","process":"RASP","value": 250},
{"key":"PAGING","process":"RASP","value": 0.00},
{"key":"CPUPR","process":"RASP","value": 0.00},
{"key":"CPU","process":"RASP","value": 1.21}
]
EOF
