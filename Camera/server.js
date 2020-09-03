var express        = require("express"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    enableWs       = require('express-ws'),
//    passport       = require("passport"),
  //  LocalStrategy  = require("passport-local"),
//    methodOverride = require("method-override"),
    cors           = require('cors'),
    ip             = require("ip");
    // Sensor         = require("./models/sensor"),
    // Chart          = require("./models/chart"),
    // Device         = require("./models/device"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    // schedule       = require('node-schedule'),
    // http          = require('http'),
    app            = express();

enableWs(app);
// requiring routes
// var indexRoutes   = require("./routes/index");

var localIP = ip.address(),
    port    = config.server.port,
    connStr = config.getConnStr();


// seedDB();
app.use(cors());
app.options('*', cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/static', express.static('public')); // static directory is going to be our directory called public

// Shortens the route declarations
// app.use("/", indexRoutes);
app.ws('/echo', (ws, req) => {
    ws.on('message', msg => {
        console.log(`msg rcv: ${msg}`)
        ws.send(msg)
    })

    ws.on('close', () => {
        console.log('WebSocket was closed')
    })
})

app.listen(port,process.env.IP, function(){
    console.log("server started on port ", port); 
});
