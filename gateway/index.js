'use strict';

var sphero = require('sphero');
var awsIot = require('aws-iot-device-sdk');

var _ = require('lodash');
var sleep = require('sleep');
var log = require('log-util');
var deasync = require('deasync');
var bb8Config = require('./bb8Config.js');

var bb8 = sphero(bb8Config.address());

// Don't do this at home turning functions to sync
bb8.syncRawMotors = deasync(bb8.setRawMotors);
bb8.syncColor = deasync(bb8.color);
bb8.syncRandomColor = deasync(bb8.randomColor);
bb8.syncRoll = deasync(bb8.roll);
bb8.syncStabilization = deasync(bb8.setStabilization);

var bb8Config = require('./bb8Config.js');

// We create the Thing Shadow of the BB8
var bb8Thing = awsIot.thingShadow(bb8Config, {'postSubscribeTimeout': 1, 'operationTimeout': 3000});

bb8Thing.updateWithState = function(someState){
	var clientToken = bb8Thing.update(bb8Config.thingName, someState);
	log.info(clientToken, someState);
}

// Register for updates
bb8Thing.register(bb8Config.thingName);

// Register for status updates
bb8Thing.on('status', function(thingName, stat, clientToken, stateObject) {
	if(clientToken === bb8Thing.firstClientToken || clientToken === bb8Thing.seconTryClientToken)
		restate(stateObject.state);
  log.info(clientToken, 'received', stat, 'on', thingName, ': ', JSON.stringify(stateObject));
});

// Receive delta updates
bb8Thing.on('delta', function(thingName, stateObject) {
  log.info('received delta on ', thingName, ': ', JSON.stringify(stateObject));

	// Let's create the new state that's need to be reported after setting
  var newState = {state:{reported:{}}};
  if(stateObject.state.color)
    newState.state.reported = _.merge(setColor(stateObject.state.color), newState.state.reported);
  if(stateObject.state.back_led != undefined)
    newState.state.reported = _.merge(setBackLed(stateObject.state.back_led), newState.state.reported);

  bb8Thing.updateWithState(newState);
});

// Receive timeout events
bb8Thing.on('timeout', function(thingName, clientToken) {
	// If it's first get (because offline actions must sync) and failed, let's try again
	if(clientToken === bb8Thing.firstClientToken){
		bb8Thing.seconTryClientToken = bb8Thing.get(bb8Config.thingName);
	}
  log.error('received timeout on', thingName, 'with token:', clientToken);
});

// Also we must register for the /bb8/commands mqtt topic. That's because thingShadow it's an instance of mqtt.Client()
bb8Thing.subscribe('/bb8/commands');

// Listen to direct orders
bb8Thing.on('message', function(topic, message){
  log.info('received message on', topic, 'with:', message.toString());
  if(topic === '/bb8/commands'){
    if(message.toString() === 'roll')
      roll();
    else if(message.toString() === 'nonono')
      noNoNo();
    else if(message.toString() === 'blush')
      blush();
    else if(message.toString() === 'crazy')
      crazy();
    else if(message.toString() === 'yes')
      yes();
    else if(message.toString() === 'alarm')
      alarm();
  }

});

// Connect to our BB8
bb8.connect(start);

// When connection is succesful, sync if needed
function start() {
	bb8.getPowerState(function(err, data) {
		if (err) {
		 	log.log("error: ", err);
		} else {
			log.info("  batteryVoltage:", data.batteryVoltage);
		}
	});

	bb8Thing.firstClientToken = bb8Thing.get(bb8Config.thingName);

	// Avoid sleep
	setInterval(function(){
		bb8.ping();
	}, 30000);
}

// Sync possible new desired state created when offline
function restate(stateObject){
	log.info('restate', stateObject);
	setColor(stateObject.desired.color);
	setBackLed(stateObject.desired.back_led);
	// Compare only modified attributes in desired
	if(!_.isEqual(stateObject.desired, _.pick(stateObject.reported, _.keys(stateObject.desired))))
		bb8Thing.updateWithState({'state':{'reported':stateObject.desired}});
}

// Update motor and odometer stats on demand
function updateState() {
  bb8.readLocator(function(err, data) {
    if (err) {
      log.error('error: ', err);
    } else {
      var state = { state: { reported: {xpos: data.xpos, ypos:data.ypos, yvel: data.yvel, xvel: data.xvel, sog: data.sog}}};
			bb8Thing.updateWithState(state);
    }
  });
}

// Set Color of BB8, list of rgb from https://github.com/orbotix/sphero.js/blob/05e267ae9ed0608f221298454f82a7404fc58237/lib/colors.js
function setColor(color) {
  bb8.color(color, 1);
  var newState = {color: color};
  return newState;
}

// Set Blue back led, values from 0 to 255
function setBackLed(color) {
  bb8.setBackLed(color);
  var newState = {back_led: color};
  return newState;
}

// Roll
function roll(){
  log.info('They see me rolling');
  var interval = setInterval(function() {
    var direction = Math.floor(Math.random() * 360);
    bb8.roll(150, direction);
    updateState();
  }, 1000);

  setTimeout(function() {
    clearInterval(interval);
    bb8.roll(0, 0);
  }, 7500);
}

// Head down and gradually turn red
function blush(){
	var oldColor = deasync(bb8.getColor)();
	bb8.syncStabilization(0);
	bb8.syncRawMotors({lmode: 0x02, lpower: 120, rmode: 0x02, rpower: 120});
	sleep.usleep(10000);
	bb8.syncRawMotors({lmode: 0x03, rmode: 0x03});
	var redColor = 0;
	while(redColor < 255){
		bb8.syncColor({ red: redColor, green: 0, blue: 0 });
		redColor += 2;
	}
	sleep.usleep(250000);
	bb8.syncColor(oldColor);

	bb8.syncRawMotors({lmode: 0x01, lpower: 120, rmode: 0x01, rpower: 120});
	sleep.usleep(10000);
	bb8.syncRawMotors({lmode: 0x03, rmode: 0x03});

	bb8.syncStabilization(1);
}

// Say no
function noNoNo(){
	var oldColor = deasync(bb8.getColor)();
	var count = 3;
	while(count-- > 0){
		bb8.syncRawMotors({lmode: 0x01, lpower: 80, rmode: 0x02, rpower: 80});
		bb8.syncColor('black');
		sleep.usleep(100000);
		bb8.syncRawMotors({lmode: 0x02, lpower: 80, rmode: 0x01, rpower: 80});
		bb8.syncColor('red');
		sleep.usleep(100000);
	}
  bb8.syncRawMotors({lmode: 0x00, rmode: 0x00});
	bb8.syncStabilization(1);
	bb8.syncColor(oldColor);
}

// Spin around
function crazy(){
	var oldColor = deasync(bb8.getColor)();
	bb8.syncRawMotors({lmode: 0x01, lpower: 80, rmode: 0x02, rpower: 160});
	var count = 2 * 5;
	while(count-- > 0){
		bb8.syncColor('red');
		sleep.usleep(2000000/10);
		bb8.syncColor('white');
	}
	bb8.syncRawMotors({lmode: 0x00, rmode: 0x00});
	bb8.syncStabilization(1);
	bb8.syncColor(oldColor);
}

// Move in circle with police lights
function alarm(){
	var count = 0;
	var oldColor = deasync(bb8.getColor)();
	//bb8.syncRawMotors({lmode: 0x01, lpower: 75, rmode: 0x02, rpower: 75});
	var direction = 0;
	while(count < 18) {
		bb8.syncRoll(150, direction);
		log.info(direction)
		bb8.syncColor('red');
		sleep.usleep(50000);
		bb8.syncColor('blue');
		sleep.usleep(50000);
		bb8.syncColor('white');
		sleep.usleep(50000);
		bb8.syncColor('orange');
		sleep.usleep(50000);

		count += 1;
		direction += 40;
		direction %= 360;
	}
	//bb8.syncRawMotors({lmode: 0x00, rmode: 0x00});
	bb8.syncStabilization(1);
	bb8.syncRoll(0, 0);
	bb8.syncColor(oldColor);

}

// Say yes
function yes(){
	var count = 3;
	var oldColor = deasync(bb8.getColor)();
	while(count-- > 0){
		bb8.syncRawMotors({lmode: 0x02, lpower: 80, rmode: 0x02, rpower: 80});
		bb8.syncColor('green');
		sleep.usleep(50000);
		bb8.syncRawMotors({lmode: 0x01, lpower: 80, rmode: 0x01, rpower: 80});
		bb8.syncColor('black');
		sleep.usleep(50000);
	}
  bb8.syncRawMotors({lmode: 0x00, rmode: 0x00});
	bb8.syncStabilization(1);
	bb8.syncColor(oldColor);
}
