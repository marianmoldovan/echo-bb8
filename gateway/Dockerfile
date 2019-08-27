FROM resin/raspberrypi2-node:0.10.22

COPY deps.sh /usr/src/app/
RUN /usr/src/app/deps.sh

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN DEBIAN_FRONTEND=noninteractive JOBS=MAX npm install --unsafe-perm
COPY . /usr/src/app

CMD [ "npm", "start" ]
