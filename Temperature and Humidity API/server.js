var express        = require("express"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    // sensor         = require('node-dht-sensor'),
    Sensor         = require("./models/sensor"),
    Chart          = require("./models/chart"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    // schedule       = require('node-schedule'),
    // http          = require('http'),
    app            = express();
// requiring routes
var indexRoutes   = require("./routes/index");

var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();

mongoose.connect(connStr,{ useNewUrlParser: true }, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
    }else{
        console.log("No errors occured");
        var gpios = [2,3];
        gpios.forEach((pin) = > {
            var newDeviceObj = {
                local_ip: localIP,
                deviceName: 'Temp/Humid Sensors',
                deviceType: 'DHT11 Sensor',
                gpio: pin
            }
            Device.create(newDeviceObj, (err, newDevice) =>{
                if(err) console.log(err);
                else{
                    newDevice.save();
                    console.log("Device saved!");
                }
            });
        })
        // query db for schedule setup
    }
});
// seedDB();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.static(__dirname + "/public"));
app.use('/static', express.static('public')); // static directory is going to be our directory called public
// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(methodOverride("_method")); // _method is what we are telling it to look for
// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// w/e function we provide to it will be called on every route
app.use(function(req, res, next){
    // w/e we put in res.locals is what's available inside of our template
    res.locals.currentUser = req.user;
    next();
});
// Shortens the route declarations
app.use("/readings", indexRoutes);
app.listen(port,process.env.IP, function(){
    console.log("server started on port ", port); 
});
