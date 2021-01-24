#!/bin/sh
IP_ADDRESS="192.168.254.202"
DEFAULT_GATEWAY_ADDRESS="192.168.254.254"
SSID='"enter ssid here"'
PSK='"enter password here"'
echo "
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
	ssid=$SSID
	psk=$PSK
	key_mgmt=WPA-PSK
}
" > /media/jonathan/boot/wpa_supplicant.conf
touch /media/jonathan/boot/ssh

echo "interface wlan0
static ip_address=$IP_ADDRESS/24
static routers=$DEFAULT_GATEWAY_ADDRESS
static domain_name_servers=$DEFAULT_GATEWAY_ADDRESS" >> /media/jonathan/rootfs/etc/dhcpcd.conf