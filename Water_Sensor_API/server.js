var express        = require("express"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    cors           = require('cors'),
    ip             = require("ip"),
    fs             = require('fs'),
    async          = require("asyncawait/async"),
    await          = require("asyncawait/await"),
    // Sensor         = require("./models/sensor"),
    // Chart          = require("./models/chart"),

    Device         = require("./models/device"),
    WaterSettings  = require("./models/waterSettings"),
    Scheduler      = require("./models/scheduler"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    // schedule       = require('node-schedule'),
    app            = express();

// requiring routes
var indexRoutes   = require("./routes/index");

var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();


// seedDB();
app.use(cors());
app.options('*', cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/static', express.static('public')); // static directory is going to be our directory called public

let options = {
    server : {
        useNewUrlParser: true,
        reconnectTries : 300,
        reconnectInterval: 60000,
        autoReconnect : true
    }
}


mongoose.connect(connStr, options, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
        setTimeout(function() {
            console.log('Connection failed. Retrying in 30 seconds.');
        }, 30000);
    }else{
        console.log("Successfully Connected!");
        // idea: pause execution for 5-30 seconds before retrying
        /**********************************************************************
        * Setup Routes For Our Server
        **********************************************************************/
        //app.use("/schedule", schedRoutes);
        app.use("/", indexRoutes);


        Device.findOne({local_ip: localIP, deviceType: 'Water Sensor'}, function(err, device){
            if(err) console.log(err.toString);
            else{
                console.log("Found device: " + device);
                console.log("Device id: " + device['_id']);
                WaterSettings.findOne({device_id: device._id}, function(err, water_config){
                    if(err) console.log(err);
                    else{
                        console.log(`Found camera: ${JSON.stringify(camera)}`);
                        Scheduler.find({'device.id': water_config["relayId"]}, function(err, schedule_configs){
                            if(err) console.log(err);
                            else{
                                console.log(`Schedule configurations found: ${schedule_configs}`);
                                // with node-schedule, create new crontab like schedules
                                // that occur a specified amount of time before and after our relay turns on
                                //  - > water_config['checkMinsBefore'] and water_config['checkMinsAfter'],
                                
                                // if our water config is set up to prevent this, send an HTTP request to
                                // to our relay device and cancel it's upcoming schedule to prevent it form overwatering
                                // - > water_config['cancelRelay'] 
                                // - > http GET /schedule/:schedule_id/cancel
                                
                                // 
                            }
                        });
                    };
                });
            }
        });

        /**********************************************************************
        * Start The Server
        **********************************************************************/
        app.listen(port,process.env.IP, function(){
            console.log("server started on port ", port); 
        });
    }
});