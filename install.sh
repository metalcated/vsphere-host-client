#!/bin/bash
################################################################################
##
## Title:       vSphere Host Client installer
## Date:        02/07/2016
## Author:      Mike G. aka metalcated
## Version:     0.1
##
## Changelog:   0.1 - Initial Release
##
################################################################################

dependencies()
{

        # define dependencies
        pkglist="pigz pv tar wget curl"

        # install pv because we need it!
        echo -e "[\e[36mESXi\e[0m] installing some dependencies"
        /usr/bin/yum install -y epel-release > /dev/null 2>&1
        /usr/bin/yum install -y pv > /dev/null 2>&1

        # install deps
        echo -e "[\e[32mESXi\e[0m] checking for additional install dependencies"
        for package in $pkglist; do
                if [[ $(yum list installed|grep "$package[.]") = "" ]]; then
                        echo -e "[\e[32mESXi\e[0m] ${package}: missing... installing"
                        /usr/bin/yum install -y $package 2>&1|pv > /dev/null
                        echo -e "[\e[32mESXi\e[0m] ${package}: install complete"
                fi
        done
}

install_java()
{


        echo -e "\n[\e[36mESXi\e[0m] staging install for java: $JAVA_INSTALL"
        # type can be jre or jdk
        JAVA_TYPE="jre"
        JAVA_VERSION="8"
        EXT="rpm"

        # set base download location
        URL="http://www.oracle.com"
        DOWNLOAD_URL1="${URL}/technetwork/java/javase/downloads/index.html"
        DOWNLOAD_URL2=$(curl -s $DOWNLOAD_URL1 | egrep -o "\/technetwork\/java/\javase\/downloads\/${JAVA_TYPE}${JAVA_VERSION}-downloads-.*\.html" | head -1)

        # check to make sure we got to oracle
        if [[ -z "$DOWNLOAD_URL2" ]]; then
          echo -e "[\e[32mESXi\e[0m] java - could not get to oracle - $DOWNLOAD_URL1"
          exit 1
        fi

        # set download url
        DOWNLOAD_URL3="$(echo ${URL}${DOWNLOAD_URL2}|awk -F\" {'print $1'})"
        DOWNLOAD_URL4=$(curl -s "$DOWNLOAD_URL3" | egrep -o "http\:\/\/download.oracle\.com\/otn-pub\/java\/jdk\/[7-8]u[0-9]+\-(.*)+\/${JAVA_TYPE}-[7-8]u[0-9]+(.*)linux-x64.${EXT}"|tail -n1)

        # check to make sure url exists
        if [[ -z "$DOWNLOAD_URL4" ]]; then
          echo -e "[\e[32mESXi\e[0m] could not get ${JAVA_TYPE} download url - $DOWNLOAD_URL4"
          exit 1
        fi
        # set download file name
        JAVA_INSTALL=$(echo $DOWNLOAD_URL4|cut -d "/" -f 8)

        if [[ "$EXT" == "rpm" ]]; then

                # delete file if exists
                if [[ -f /tmp/$JAVA_INSTALL ]]; then
                        rm -f /tmp/$JAVA_INSTALL
                fi
                # download fresh java rpm
                echo -e "[\e[32mESXi\e[0m] downloading: $DOWNLOAD_URL4"
                wget --no-cookies --no-check-certificate --header "Cookie: oraclelicense=accept-securebackup-cookie" $DOWNLOAD_URL4 -O /tmp/$JAVA_INSTALL 2>&1|pv > /dev/null
                # install rpm
                echo -e "[\e[32mESXi\e[0m] installing: $JAVA_INSTALL\r"
                rpm -Uvh /tmp/$JAVA_INSTALL 2>&1|pv > /dev/null
                # get dirname
                JAVA_DIR=$(ls -tr /usr/java/|grep ${JAVA_TYPE}|head -n 1)
                # set temp env var
                export JAVA_HOME=/usr/java/${JAVA_DIR}
                # set perm env var
                if [[ -z $(grep $JAVA_DIR /etc/environment) ]]; then
                        echo "export JAVA_HOME=/usr/java/${JAVA_DIR}" >> /etc/environment
                fi
                # set if jdk is used
                if [[ "$JAVA_TYPE" = "jdk" ]]; then
                        # set temp env var
                        export JRE_HOME=/usr/java/${JAVA_DIR}/jre
                        # set perm env var
                        if [[ -z $(grep $JAVA_DIR /etc/environment) ]]; then
                                echo "export JRE_HOME=/usr/java/${JAVA_DIR}/${JAVA_TYPE}" >> /etc/environment
                        fi
                fi
                # make sure java installed
                ls /usr/java/${JAVA_DIR} > /dev/null 2>&1
                if [[ "$?" != 0  ]]; then
                        echo -e "[\e[32mESXi\e[0m] error - java does not seem to be installed correctly\n"
                        exit 1
                else
                        echo -e "[\e[32mESXi\e[0m] java install complete"
                fi
        fi
}

install_esxiclient()
{
        echo
        install_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        if [[ ! -d $install_dir/vsphere-host-client ]]; then
                echo -e "[\e[31mESXi\e[0m] error - unable to find: $install_dir/vsphere-host-client"
                exit $?
        fi
        echo -e "[\e[36mESXi\e[0m] choose a target install location for the vsphere-host-client directory:"
        read -p "[ESXi] choose your target - (i.e. /opt): " dest
        while [[ -z $dest ]]; do
                read -p "[ESXi] choose your target - (i.e. /opt): " dest
        done
        if [[ ! -d $dest ]]; then
                echo -e "[\e[31mESXi\e[0m] unable to locate your target directory, try again."
                install_esxiclient
        fi
        \cp -Rv $install_dir/vsphere-host-client $dest/ 2>&1|pv > /dev/null
        if [[ -d $install_dir/vsphere-host-client ]]; then
                echo -e "[\e[32mESXi\e[0m] vsphere-host-client has been copied to: $dest/vsphere-host-client"
        else
                echo -e "[\e[31mESXi\e[0m] error - something went wrong during the copy, permissions? read/only?"
                exit $?
        fi
}

start_client()
{
        echo -e "\n[\e[36mESXi\e[0m] starting the web client for the first time"
        cd $dest/vsphere-host-client
        ./start.sh
        echo
}


echo -e "\n[\e[32mESXi\e[0m] installing ESXi Web Client from @linuxcoding.org\n"

# install dependencies
dependencies
# install java
install_java
# install esxi client
install_esxiclient
# start the client for the first time
start_client
