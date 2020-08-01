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
router.get("/", (req, res) => {
    // Device.find({deviceType: "DHT11 Sensor"},  (err, devices)=>{
    //     if(err) console.log(err);
    //     else{
    //         console.log(devices);
    //         var data = [];
    //         devices.forEach(function(device, i, arr){
    //             console.log(device);
    //              http.get("http://" +device['local_ip'] + ":" + device['port'] + "/", (resp) => {
    //                 // console.log(resp)
    //                 resp.on('data', function(chunk) {
    //                     var myData = JSON.parse(chunk);
    //                     myData.forEach(function(reading){
    //                       reading['_id'] = device['_id'];
    //                       reading['deviceName'] = device['deviceName'];
    //                       data.push(reading); 
    //                     });
    //                     console.log("data arr: ", data);
    //                     if(i == arr.length - 1){
    //                         console.log("data arr: ", data);
    //                         res.render("index", { sensors: data, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
    //                     }
    //                 });
    //             }).on("error", (err) => {
    //                 console.log("Error: " + err.message);
            
    //             });
    //         })
    //     }
    // });
    // http.get("http://192.168.1.128:8080/readings", (resp) => {
    //     // console.log(resp)
    //     let str = '';
    //     resp.on('data', function(chunk) {
    //         var data = JSON.parse(chunk);
    //         console.log(data);
    //         res.render("index", { sensors: data, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
    //     });
    // }).on("error", (err) => {
    //     console.log("Error: " + err.message);

    // });
    res.render("index", { sensors: [], scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
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
