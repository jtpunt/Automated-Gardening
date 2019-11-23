#!/bin/sh
sudo apt-get autoclean
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade
sudo apt-get install nodejs npm
npm install
crontab -l > oldcrontab
cp oldcrontab newcrontab
echo "@reboot /home/pi/Smart-Gardening/Relay_Server/start.sh > /tmp/listener1.log 2>&1" >> newcrontab
crontab < newcrontab
