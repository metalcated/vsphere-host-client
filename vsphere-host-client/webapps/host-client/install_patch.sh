#!/bin/bash
echo "Patching Webconsole / VMRC @linuxcoding.org"
echo "Downloading..."
wget https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.js
wget https://ajax.googleapis.com/ajax/libs/chrome-frame/1.0.3/CFInstall.min.js
#wget https://linuxcoding.org/patch/vsphere-host-client/webconsole.patch
sleep 2
echo "Saving..."
mv -f jquery-ui.js js/
mv -f CFInstall.min.js js/
sleep 2
echo "Patching..."
#patch < webconsole.patch
echo "Done"
