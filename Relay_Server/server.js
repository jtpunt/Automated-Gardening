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
    fs          = require("fs"),
    path        = require("path"),
    isIp        = require('is-ip'),
    fileName    = path.join("../Relay_Server/lastIPAddr.txt"),
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
var connFailed = true;
do{
    mongoose.connect(connStr,{ useNewUrlParser: true }, function(err){
        if(err){
            console.log("Error connecting to mongodb", err);
            // default schedule here
        }else{
            console.log("Successfully Connected!");
            connFailed = false;
            // idea: pause execution for 5-30 seconds before retrying
        }
    });
}while(connFailed);

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
