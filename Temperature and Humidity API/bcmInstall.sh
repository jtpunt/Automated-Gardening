# if there's a problem involving npm and installing node-dht-sensor, just remove the node_modules folder and then retry this script
#!/bin/sh
tar zxvf bcm2835-1.45.tar.gz -C ./
cd ./bcm2835-1.45
./configure
make
sudo make check
sudo make install
sudo npm install node-dht-sensor -g
