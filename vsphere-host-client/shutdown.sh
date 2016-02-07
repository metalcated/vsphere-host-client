#!/bin/bash
pid=`cat tomcat.pid`
kill -9 $pid
echo "vSphere Host Client Shutdown"
