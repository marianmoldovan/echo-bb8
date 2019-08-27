module.exports = {
	'host': '',
	'port': 8883,
	'clientId': '',
	'thingName': '',
	'caCert': '',
	'clientCert': '',
	'privateKey': ''
};

module.exports.address = function(){
	var bb8Addres = '00:00:00:00:00:00';
	// Becasue MacOs needs uuid not physical adress
	if(process.platform === 'darwin')
		bb8Addres = 'aaaaaaaaaaaaaaaaaaaaaaa';
	return bb8Addres;
}
