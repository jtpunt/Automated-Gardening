var middleware = {
	isLoggedIn(req, res, next){
	    if(req.session.admin){
	        return next();
	    }
	    req.flash("error", "You need to be logged in to do that");
	    res.redirect("/login");
	},
	logout(req, res, next){
		req.session.destroy((err) => {
			if(err) return next(err);
			else return res.redirect("/");
		});
	}
}
module.exports = middleware