var awsIot = require('aws-iot-device-sdk');
var doc = require('dynamodb-doc');
var uuid = require('uuid');
var AlexaSkill = require('./AlexaSkill');
var dynamo = new doc.DynamoDB();

var APP_ID = <my-appid>;

var bb8Config = {
	region: 'us-east-1',
	clientId: uuid.v4(),
	thingName: 'bb8',
	caPath: <my-capath>,
	certPath: <my-cert-path>,
	keyPath: <my-keypath>
};
var bb8Device = awsIot.device(bb8Config);

var BB8Controller = function () {
    AlexaSkill.call(this, APP_ID);
};
BB8Controller.prototype = Object.create(AlexaSkill.prototype);
BB8Controller.prototype.constructor = BB8Controller;

function checkColorClientToken(clientToken) {
	if (clientToken===bb8Thing.colorClientToken) {
			bb8Thing.colorResponse.tell("So cute.");
	}
}

/**
 * Intents
 */
BB8Controller.prototype.intentHandlers = {

    "GetColor": function (intent, session, response) {
      handleGetColorRequest(intent, response);
    },

    "SetColor": function (intent, session, response) {
      handleSetColorRequest(intent, response);
    },

		"NoNoNo": function (intent, session, response) {
			handleNoNoNoRequest(intent, response);
		},

		"Roll": function (intent, session, response) {
			handleRollRequest(intent, response);
		},

		"Blush":  function (intent, session, response) {
			handleBlushRequest(intent, response);
		},

		"Crazy":  function (intent, session, response) {
			handleCrazyRequest(intent, response);
		},

		"Yes":  function (intent, session, response) {
			handleYesRequest(intent, response);
		},

		"Alarm":  function (intent, session, response) {
			handleAlarmRequest(intent, response);
		},

    "AMAZON.HelpIntent": function (intent, session, response) {
      response.ask("Tell me what do you want from bb eight and I will translate into his robotic language.");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
      response.tell("Goodbye.");
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
      response.tell("Goodbye.");
    }

};

/**
 * Get BB8's color
 */
function handleGetColorRequest(intent, response) {

  var queryParams = {
    TableName: 'BB8ShadowStates',
    KeyConditions: [
      dynamo.Condition("id", "EQ", "BB8")
    ],
    Limit: 1,
    ScanIndexForward: false
	};

  dynamo.query(queryParams, function(err, data){
    if (err) {
      console.log(err);
    }
    else {
      console.log(data);
      var speechOutput = "bb eight's color is " + data.Items[0].payload.state.reported.color;
      response.tell(speechOutput);
    }
  });
};

/**
 * Set BB8's color
 */
 function handleSetColorRequest(intent, response) {
   console.log(intent.slots.Color.value);
	 bb8Device.publish('$aws/things/bb8/shadow/update', JSON.stringify({"state":{"desired":{"color" : intent.slots.Color.value}}}), function(){
		 response.tell("So cute.");
	 });
 };

/**
 * Tell BB8 to nonono
 */
 function handleNoNoNoRequest(intent, response) {
	 bb8Device.publish("/bb8/commands","nonono", function(){
		 response.tell("No no no.");
	 });
 };

/**
 * Tell BB8 to roll
 */
 function handleRollRequest(intent, response) {
	 bb8Device.publish("/bb8/commands","roll", function(){
		 response.tell("Go go go!.");
	 });
 };

/**
 * Tell BB8 to blush
 */
 function handleBlushRequest(intent, response) {
	 bb8Device.publish("/bb8/commands","blush", function(){
		 response.tell("Nicest robot in the galaxy.");
	 });
 };

/**
 * Set BB8's crazinesst
 */
 function handleCrazyRequest(intent, response) {
	 bb8Device.publish("/bb8/commands", "crazy", function(){
		 response.tell("Oh my god!");
	 });
 };

/**
 * Tell BB8 to say yes
 */
 function handleYesRequest(intent, response) {
	 bb8Device.publish("/bb8/commands", "yes", function(){
		 response.tell("Right.");
	 });
 };

/**
 * Ask BB8 to alarm
 */
 function handleAlarmRequest(intent, response) {
	 bb8Device.publish("/bb8/commands", "alarm", function(){
		 response.tell("Danger!");
	 });
 };

/**
 * Main function
 */
 exports.handler = function (event, context) {
   var bB8Controller = new BB8Controller();
   bB8Controller.execute(event, context);
 };
