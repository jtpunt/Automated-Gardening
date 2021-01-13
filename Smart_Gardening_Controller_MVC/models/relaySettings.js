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
	gpio:  {
        type: Number,
        enum: [2,3,4,5,6,12,13,16,17,18,19,20,21,22,23,24,25,26,27]
    },
	relayType: {
		type: String,
		enum: ['air conditioner', 'light', 'water pump']
	}
});
relaySettingsSchema.index({relayId: 1, gpio: 1}, { unique: true});
module.exports = mongoose.model('RelaySettings', relaySettingsSchema, 'relaySettings');