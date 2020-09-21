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
// test comment for git
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
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
        /**********************************************************************
        * Start The Server
        **********************************************************************/
        app.listen(port, function() {
          	console.log('Express started on http://localhost:' + port + '; press Ctrl-C to terminate.');
        });
    }
});

