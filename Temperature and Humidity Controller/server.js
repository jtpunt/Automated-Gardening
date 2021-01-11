var express        = require("express"),
    bodyParser     = require("body-parser"),
    flash          = require("connect-flash"),
    mongoose       = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    // Sensor         = require("./models/sensor"),
    // Chart          = require("./models/chart"),
    // Device         = require("./models/device"),
    // User           = require("./models/user"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    ip             = require("ip"),
        
    app            = express();
// requiring routes
var indexRoutes   = require("./routes/index"),
    adminRoutes   = require("./routes/admin"),
    cameraRoutes  = require("./routes/camera"),
    chartRoutes   = require("./routes/charts"),
    deviceRoutes  = require("./routes/devices"),
    journalRoutes = require("./routes/journal"),
    roomRoutes    = require("./routes/room"),
    schedRoutes   = require("./routes/schedules"),
    sensorRoutes  = require("./routes/sensors"),
    soilRoutes    = require("./routes/soil");
    
var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();

let options = {
    server : {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        reconnectTries : 300,
        reconnectInterval: 60000,
        autoReconnect : true
    }
}
mongoose.connect(connStr, options, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
    }else{
        console.log("No errors occured");
    }
});
// seedDB();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended: true}));
// app.use(express.static(__dirname + "/public"));
app.use('/static', express.static('public')); // static directory is going to be our directory called public

app.use(methodOverride("_method")); // _method is what we are telling it to look for
app.use(flash()); // must be used before passport configuration, flash also require


/*********************************************************************
 * Secret is used to encode/decode the sessions. We aren't going to be
 * storing data inside the sessions, it's going to be encoded. This secret
 * below will be used to unencode/decode that info in the session.
 ********************************************************************/
app.use(require("express-session")({ // in-line request
    secret: "Rusty is the best and cutest dog in the world",
    resave: false, // required by default
    saveUninitialized: false // required by default
}));
/*********************************************************************
 * This code sets passport up so that it works in our application.
 * We need these 2 methods anytime we need these two lines anytime we
 * are going to use passport.
 *********************************************************************/
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate())); // UserSchema.plugin(passportLocalMongoose);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// w/e function we provide to it will be called on every route
app.use(function(req, res, next){
    // w/e we put in res.locals is what's available inside of our template
    res.locals.currentUser = req.user;
    res.locals.page_name = "home";
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// Shortens the route declarations
app.use("/", indexRoutes);
app.use("/admin", adminRoutes);
app.use("/camera", cameraRoutes);
app.use("/charts", chartRoutes);
app.use("/device", deviceRoutes);
app.use("/journal", journalRoutes);
app.use("/room", roomRoutes);
app.use("/schedule", schedRoutes);
app.use("/sensors", sensorRoutes);
app.use("/soil", soilRoutes);

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
