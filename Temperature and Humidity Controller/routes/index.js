var express = require("express"),
    async = require("asyncawait/async"),
    await = require("asyncawait/await"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    User   = require("../models/user"),
    middleware = require("../middleware"),
    http = require('http'),
    passport = require("passport"),
    router = express.Router();


// root route
router.get("/", async function(req, res){
    let dht11Devices = await Device.find({deviceType: "DHT11 Sensor"}),
        dht22Devices = await Device.find({deviceType: "DHT22 Sensor"}),
        sensors = [];
    
    if(dht11Devices !== undefined && dht11Devices !== null){
        console.log("dht11Devices: " + dht11Devices);
        dht11Devices.forEach(function(dht11Device){
            dht11Device['gpio'].map(function(gpio){
                let tempId = "temp" + gpio + dht11Device['_id'],
                    humidId = "humid"  + gpio + dht11Device['_id'];
                    
                sensors.push({
                    deviceName: dht11Device['deviceName'],
                    tempId: tempId,
                    humidId: humidId
                })
            });
        })
    }
    
    if(dht22Devices !== undefined && dht22Devices !== null){
        console.log("dht22Devices: " + dht22Devices);
        dht22Devices.forEach(function(dht22Device){
            dht22Device['gpio'].map(function(gpio){
                let tempId = "temp" + gpio + dht22Device['_id'],
                    humidId = "humid"  + gpio + dht22Device['_id'];
                    
                sensors.push({
                    deviceName: dht22Device['deviceName'],
                    tempId: tempId,
                    humidId: humidId
                })
            });
        })
    }

    res.render("index", { sensors: sensors, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
});
router.get("/register", function(req, res){
    res.render("register");
});
// Handling user sign up
router.post("/register", function(req, res){
    /***********************************************************************
     * We create a new user object with just the username data from the form
     * You don't actually save the password to the database, you pass the password 
     * as a second argument to User.register. User.register will take this new user
     * that has a username and then hash that password - it'll turn it into a huge 
     * string of numbers and letters and stores that into the database. If everything
     * goes well, it will return a new user that contains the username and the hashed 
     * password.
     ***************************************************************************/
    var newUser = new User({username: req.body.username});
    console.log(newUser);
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/schedule");
        });
    });
});
router.get('/login', function(req, res){
    res.render('login');
});
router.post('/login',  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/login",
    failureFlash: "Fail"
}),function(req, res){
    
});
// This route handles the process for logging a user out, where the request and response
// objects are passed to the middleware.logout function, where all of the logic to handle
// logging out is stored
router.get("/logout", middleware.logout, function(req, res){

})
// This route shows the forgot password form where the user can recover their password
router.get("/forgot", function(req, res){
    console.log("Show forgot form");
    res.render("forgot");
});
router.post("/forgot", function(req, res){
    var mysql = req.app.get('mysql');
    var stylesheets = null;
    var scripts = null;
    var redirect = "/";
    var sql = "SELECT id FROM User WHERE username = ? AND secret = ?;";
    console.log("in post /forgot");
    var inserts = [req.body.username, req.body.secret]; 
    var inserts1 = [req.body.password1, req.body.password2];
    // make sure the user is in the database first before trying to update their password

    // req.flash("success", "Password successfully updated!");
    // res.redirect(redirect);
});
module.exports = router;
