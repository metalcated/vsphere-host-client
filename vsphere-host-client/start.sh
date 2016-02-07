#!/bin/bash

run_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# get ip locally
ip="$(ifconfig|grep inet|head -n1|awk {'print $2'})"

# write out index.html
python $run_dir/bin/setip.py

# replace ip in server.xml
sed -ri 's/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b'/$ip/ $run_dir/conf/server.xml

# source the environment file
source $run_dir/.env-start

# run start script
$run_dir/bin/startup.sh

# tell me where the server started
echo -e "\n[\e[36mESXi\e[0m] \e[4mvSphere Host Client\e[0m"
echo -e "[\e[32mESXi\e[0m] running at: http://${ip}:8080/host-client/"

# done
