var mongoose = require("mongoose");
var roomSchema = new mongoose.Schema({
    roomName: String,
    roomType: {
    	type: String,
    	enum: ['Vegetative and Flowering', 'Vegetative', 'Flowering']
    }, 
    roomGrowSystem: {
        type: String,
        enum: ['Soil', 'Ebb and Flow']
    },
    roomDeviceIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device"
    }],
    roomWaterDetails: [{
		relayId: { // deviceType: 'water pump', not sure how this would be enforced
	    	type: mongoose.Schema.Types.ObjectId,
	    	ref: "Device"
		},
        waterFlowRate: Number, // Gallons Per Hour
    	containerSize: Number,
    	numOfWaterLines: Number
    }]
});
module.exports = mongoose.model('Room', roomSchema, 'rooms');