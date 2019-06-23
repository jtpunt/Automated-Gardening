/*******************************************
* Author: Jonathan Perry
* Date: 10/16/17
* Assignment: CS 290 - GET and POST Checker
*******************************************/
/**********************************************************************
* The tools needed for this web application
**********************************************************************/
var express = require('express');
var routes = require('./routes/index.js');
var mongoose = require("mongoose");
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser'); // body parser middleware
var ip  = require("ip");
var app = express();
var localIP = ip.address();
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();
/**********************************************************************
* Setup our handlebars engine for handling file extensions that end in
* 'handlebars'
**********************************************************************/
app.engine('handlebars', handlebars.engine); 
app.set('view engine', 'handlebars');
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
        console.log("No errors occured");
        var newDeviceObj = {
            local_ip: localIP,
            deviceName: 'New Relay Server',
            deviceType: 'Relay Server',
        }
        Device.create(newDeviceObj, (err, newDevice) =>{
            if(err) console.log(err);
            else{
                newDevice.save();
                console.log("Device saved!");
            }
        });
    }
});
/**********************************************************************
* Setup Routes For Our Server
**********************************************************************/
routes(app);
/**********************************************************************
* Start The Server
**********************************************************************/
app.listen(port, function() {
  	console.log('Express started on http://localhost:' + port + '; press Ctrl-C to terminate.');
});
