/*******************************************
* Author: Jonathan Perry
* Date: 10/16/17
* Assignment: CS 290 - GET and POST Checker
*******************************************/
/**********************************************************************
* The tools needed for this web application
**********************************************************************/
var express     = require('express'),
    mongoose    = require("mongoose"),
    bodyParser  = require('body-parser'), // body parser middleware
    Device      = require("./models/device"),
    ip          = require("ip"),
    app         = express();

var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();
    
var indexRoutes = require('./routes/index.js');
/**********************************************************************
* Setup our handlebars engine for handling file extensions that end in
* 'handlebars'
**********************************************************************/
//app.engine('handlebars', handlebars.engine); 
//app.set('view engine', 'handlebars');
/**********************************************************************
* Setup what type of data the server can receive via GET/POST requests
**********************************************************************/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
mongoose.connect(connStr,{ useNewUrlParser: true }, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
    }else{
        console.log("Successfully Connected!");
        // if local text file does not exist
        //    create local file
        //    write local ip address to file
        //    update database with new device
        // console.log("No errors occured");
        // var newDeviceObj = {
        //     local_ip: localIP,
        //     deviceName: 'New Relay Server',
        //     deviceType: 'Relay Server',
        // }
        // Device.create(newDeviceObj, (err, newDevice) =>{
        //     if(err) console.log(err);
        //     else{
        //         newDevice.save();
        //         console.log("Device saved!");
        //     }
        // });
        // else // local file does exist
        //    read IP address from local text file
        //    if local_file_ip !== localIP // has the IP address changed?
        //       update database
        //       update local text file
        //    else // IP address has not changed
        
    }
});

/**********************************************************************
* Setup Routes For Our Server
**********************************************************************/
//app.use("/schedule", schedRoutes);
app.use("/", indexRoutes);
/**********************************************************************
* Start The Server
**********************************************************************/
app.listen(port, function() {
  	console.log('Express started on http://localhost:' + port + '; press Ctrl-C to terminate.');
});
