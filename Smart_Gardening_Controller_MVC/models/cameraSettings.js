var mongoose = require("mongoose");
var cameraSettingsSchema = new mongoose.Schema({
	// somehow you need to specify that the water id refers to a 'Water Sensor' device type
	camera_id: {
    	type: mongoose.Schema.Types.ObjectId,
    	ref: "Device"
	},
	height: Number,
	width: Number,
	rotation: {
		type: Number,
		enum: [0, 90, 180, 240]
	}
});
module.exports = mongoose.model('CameraSettings', cameraSettingsSchema, 'cameraSettings');