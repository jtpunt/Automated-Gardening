var express        = require("express"),
    bodyParser     = require("body-parser"),
    mongoose       = require("mongoose"),
    enableWs       = require('express-ws'),
    cors           = require('cors'),
    ip             = require("ip"),
    raspividStream = require('raspivid-stream');
    // Sensor         = require("./models/sensor"),
    // Chart          = require("./models/chart"),
    Camera         = require("./models/cameraSettings"),
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
        let cameraHeight = 540,
            cameraWidth = 960;
        Device.find({local_ip: localIP, deviceType: 'Camera'}, function(err, device){
            if(err) console.log(err.toString);
            else{
                console.log("Found device: " + device);
                Camera.find({camera_id: device['_id']}, function(err, camera){
                    if(err) console.log(err);
                    else{
                        console.log(`Found camera: ${JSON.stringify(camera)}`);

                        cameraHeight = camera['height'];
                        cameraWidth = camera['width'];
                    }
                })
            }
        });
        app.ws('/video-stream', (ws, req) => {
            console.log("WebSocket created");
            console.log(`using height: ${cameraHeight}`);
            console.log(`using width: ${cameraWidth}`);
            ws.send(JSON.stringify({
                action: 'init',
                width: cameraWidth,
                height: cameraHeight
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

        /**********************************************************************
        * Start The Server
        **********************************************************************/
        app.listen(port,process.env.IP, function(){
            console.log("server started on port ", port); 
        });
    }
});