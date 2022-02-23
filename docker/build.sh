#!/bin/sh

tar cf gdb-console.tar -C .. package.json backend build
docker build -t gdb-console:0.2.0 .
