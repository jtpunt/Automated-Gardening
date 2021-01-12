let User = require("../models/user");

var middleware = {
	verifyAdminAccount(req, res, next){
	    let scheduleObj = req.body,
	        admin_id    = scheduleObj['admin_id'].toString();
	        
	    console.log("verifyAdminAccount: " + admin_id);
		User.findOne({"_id":admin_id}, function(err, user){
		    if(err){
		        console.log(err.toString);
		        res.status(404).send("you must be logged in as an admin to perform that action");
		    }
		    else{
		        console.log("user: " + user);
		        next();
		    }
		});
		
		
	}
}
module.exports = middleware