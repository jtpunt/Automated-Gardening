var mongoose = require("mongoose");
var waterSettingsSchema = new mongoose.Schema({
	// somehow you need to specify that the water id refers to a 'Water Sensor' device type
	waterId: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: "Device"
	},
	// somehow you need to specify that the relay id refers to a 'Relay Server' device type
	relayId: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: "Device"
	},
	checkMinsBefore: Number,
	checkMinsAfter: Number,
	waterDetected: [date: Date]
}
module.exports = mongoose.model('WaterSettings', waterSettingsSchema, 'waterSettings');