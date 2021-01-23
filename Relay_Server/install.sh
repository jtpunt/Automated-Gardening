#!/bin/sh
sudo apt-get autoclean
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade
wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash;
sudo node-install -v 15;
npm install
crontab -l > oldcrontab
cp oldcrontab newcrontab
echo "@reboot /home/pi/Smart-Gardening/Relay_Server/start.sh > /tmp/listener1.log 2>&1" >> newcrontab
crontab < newcrontab
