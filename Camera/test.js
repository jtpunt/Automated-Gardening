const PiCamera = require('pi-camera');

var schedule = require('node-schedule');
var date  = new Date(Date.now() + 5000);
const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/test.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
});

function createCamera(mode, outputFileName, fileFormat, width, height, noPreview){
    let cameraObj = {
        mode: mode,
        output: `${__dirname}/${outputFileName}.${fileFormat}`,
        width: width,
        height: height,
        nopreview: noPreview 
    },
    myCamera = new PiCamera(cameraObj);
    return myCamera;
}

var j = schedule.scheduleJob(date, function(){
    // this would schedule would be created at  18:51:00
    var x = schedule.scheduleJob('*/1 * * * *', function(){
        let mode = 'photo',
            outputFileName = 'test' + Math.floor(Math.random() * Math.floor(max)),
            fileFormat = 'jpg',
            width = 640,
            height = 480,
            noPreview = true;
        let myNewCamera = createCamera(mode, outputFileName, fileFormat, width, height, nopreview);
        //myCamera.snap()
        myNewCamera.snap()
        .then((result) => {
          // Your picture was captured
          console.log("pic taken: " + result);
        })
        .catch((error) => {
           // Handle your error
           console.log(error);
        }); 
    })
});
