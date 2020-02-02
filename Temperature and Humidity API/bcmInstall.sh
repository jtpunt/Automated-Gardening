#!/bin/sh
tar zxvf bcm2835-1.56.tar.gz -C ./
cd ./bcm2835-1.56
./configure
make
sudo make check
sudo make install
sudo npm install node-dht-sensor -g
