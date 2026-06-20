#!/bin/bash
cd /opt/new-api
export SQL_DSN='root:20260520@tcp(127.0.0.1:3307)/new_api?charset=utf8mb4&parseTime=True&loc=Local'
exec ./new-api-latest
