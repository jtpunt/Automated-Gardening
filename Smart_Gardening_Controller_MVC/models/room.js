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
        relaySettingsId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RelaySettings"
        },
        pumpWaterFlowRate: Number, // Gallons Per Hour
        manifoldPortWaterFlowRate: Number, 
    	containerSize: Number,
    	numOfWaterLines: Number,
        numOfWaterLinesUsed: Number
    }],
    roomActiveSchedules: {
        lightSchedules: {
            vegSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Scheduler"
            }],
            flowerSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Scheduler"
            }]
        },
        waterSchedules: {
            vegSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Scheduler"
            }],
            flowerSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Scheduler"
            }]
        }
    },
    roomScheduleHistory: [{
        dateOfChange: Date,
        lightSchedules: {
            vegSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "SchedulerHistory"
            }],
            flowerSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "SchedulerHistory"
            }]
        },
        waterSchedules: {
            vegSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "SchedulerHistory"
            }],
            flowerSchedules: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "SchedulerHistory"
            }]
        }
    }]
});
module.exports = mongoose.model('Room', roomSchema, 'rooms');