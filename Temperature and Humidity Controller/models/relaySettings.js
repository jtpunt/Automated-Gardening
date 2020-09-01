var mongoose = require("mongoose");
var relaySettingsSchema = new mongoose.Schema({
	relayId: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: "Device"
	},
	/* **************** https://www.npmjs.com/package/onoff ***************************
	* direction - A string specifying whether the GPIO should be configured as an 
	* input or output. The valid values are: 'in', 'out', 'high', and 'low'. 
	* If 'out' is specified the GPIO will be configured as an output and the value of 
	* the GPIO will be set to 0. 'high' and 'low' are variants of 'out' that configure 
	* the GPIO as an output with an initial level of 1 or 0 respectively.
	***********************************************************************************/
	direction: {
		type: String,
		enum: ['in', 'out', 'high', 'low']
	},
	desired_state: Boolean
}
module.exports = mongoose.model('RelaySettings', relaySettingsSchema, 'relaySettings');