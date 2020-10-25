var mongoose = require("mongoose");
var roomSchema = new mongoose.Schema({
    roomName: String,
    roomDeviceIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device"
    }]   
});
module.exports = mongoose.model('Room', roomSchema, 'rooms');