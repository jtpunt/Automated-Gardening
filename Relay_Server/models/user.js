var mongoose = require("mongoose");
var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    keygen: String
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);