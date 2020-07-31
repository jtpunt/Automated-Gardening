var express        = require("express"),
    bodyParser     = require("body-parser"),
    flash          = require("connect-flash"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    // sensor         = require('node-dht-sensor'),
    Sensor         = require("./models/sensor"),
    Chart          = require("./models/chart"),
    Device         = require("./models/device"),
    User           = require("./models/user"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    ip             = require("ip"),
        
    app            = express();
// requiring routes
var indexRoutes   = require("./routes/index"),
    deviceRoutes  = require("./routes/devices"),
    sensorRoutes  = require("./routes/sensors"),
    chartRoutes   = require("./routes/charts"),
    schedRoutes   = require("./routes/schedules"),
    adminRoutes   = require("./routes/admin");
    
var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();
    

mongoose.connect(connStr,{ useNewUrlParser: true }, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
    }else{
        console.log("No errors occured");
    }
});
// seedDB();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.static(__dirname + "/public"));
app.use('/static', express.static('public')); // static directory is going to be our directory called public

// app.use(require("express-session")({
//     secret: "Once again Rusty wins cutest dog!",
//     resave: false,
//     saveUninitialized: false
// }));
app.use(methodOverride("_method")); // _method is what we are telling it to look for
app.use(flash()); // must be used before passport configuration, flash also require

/*********************************************************************
 * This code sets passport up so that it works in our application.
 * We need these 2 methods anytime we need these two lines anytime we
 * are going to use passport.
 *********************************************************************/
app.use(passport.initialize());
app.use(passport.session());

app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.verifyPassword(password)) { return done(null, false); }
            return done(null, user);
        });
    }
));

// w/e function we provide to it will be called on every route
app.use(function(req, res, next){
    // w/e we put in res.locals is what's available inside of our template
    //res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// Shortens the route declarations
app.use("/", indexRoutes);
app.use("/admin", adminRoutes);
app.use("/devices", deviceRoutes);
app.use("/sensors", sensorRoutes);
app.use("/charts", chartRoutes);
app.use("/schedule", schedRoutes);

app.use(function(req,res){
    res.status(404);
    res.render('404');
});
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});
app.listen(port, process.env.IP, function(){
    console.log("server started on port ", port); 
});
