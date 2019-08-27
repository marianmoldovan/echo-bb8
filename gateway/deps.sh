#!/bin/bash

# install bluetooth

mkdir -p libs/bluez
cd libs/bluez
wget https://www.kernel.org/pub/linux/bluetooth/bluez-5.32.tar.xz

apt-get -q update
apt-get install -y libusb-dev make gcc libusb-1.0-0.dev libreadline-dev libudev-dev libglib2.0-dev libical-dev libdbus-1-dev libdbus-glib-1-dev apt-utils

tar -xvf bluez-5.32.tar.xz
cd bluez-5.32

./configure --disable-systemd
make
make install
cd ..

npm install -g pm2
