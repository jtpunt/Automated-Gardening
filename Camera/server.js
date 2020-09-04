var express        = require("express"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    enableWs       = require('express-ws'),
    cors           = require('cors'),
    ip             = require("ip"),
    raspividStream = require('raspivid-stream');
    // Sensor         = require("./models/sensor"),
    // Chart          = require("./models/chart"),
    Device         = require("./models/device"),
    env            = process.env.NODE_ENV || 'development',
    config         = require('./config')[env],
    // schedule       = require('node-schedule'),
    app            = express();

enableWs(app);
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

// Shortens the route declarations
app.use("/", indexRoutes);
app.ws('/echo', (ws, req) => {
    console.log("WebSocket created")
    ws.send(JSON.stringify({
        action: 'init',
        width: '960',
        height: '540'
    }));
    var videoStream = raspividStream({ rotation: 180 });
    
    videoStream.on('data', (data) => {
        ws.send(data, { binary: true }, (error) => { 
            if (error) console.error(error); 
        });
    });

    ws.on('close', () => {
        console.log('WebSocket was closed')
        videoStream.removeAllListeners('data');
    })
})

app.listen(port,process.env.IP, function(){
    console.log("server started on port ", port); 
});
