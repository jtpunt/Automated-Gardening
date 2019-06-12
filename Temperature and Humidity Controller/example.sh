#!/bin/sh
cd ~/Documents/sensor
ls
/usr/local/bin/forever start -c python3 sensor.py
/usr/local/bin/forever start server.js
/usr/local/bin/forever start relayController.js
