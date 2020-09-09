var mongoose = require("mongoose");
var cameraSettingsSchema = new mongoose.Schema({
	// somehow you need to specify that the water id refers to a 'Water Sensor' device type
	camera_id: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: "Device"
	},
	height: Number,
	width: Number
});
module.exports = mongoose.model('CameraSettings', cameraSettingsSchema, 'cameraSettings');