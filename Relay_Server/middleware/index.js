let User = require("../models/user");

var middleware = {
	verifyAdminAccount(req, res, next){
	    let scheduleObj = req.body,
	        admin_id    = scheduleObj['admin_id'] || undefined,
	        notAdminMsg = "you must be an admin to perform that action";

	    if(admin_id === undefined)
	    	res.status(404).send(notAdminMsg);

		User.findOne({"_id":admin_id.toString()}, function(err, user){
		    if(err){
		        console.log(err.toString);
		        res.status(404).send(notAdminMsg);
		    }
		    else{
		        console.log("user: " + user);
		        next();
		    }
		});
		
		
	}
}
module.exports = middleware