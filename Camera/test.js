const PiCamera = require('pi-camera');
let schedule = require('node-schedule');

let startTime = new Date(Date.now() + 2000),
    endTime = new Date(startTime.getTime() + 1*60*60*1000),
    date  = new Date(Date.now() + 2000);

// const myCamera = new PiCamera({
//   mode: 'photo',
//   output: `${ __dirname }/test.jpg`,
//   width: 640,
//   height: 480,
//   nopreview: true,
// });
// myCamera.snap()
// .then((result) => {
//   // Your picture was captured
//   console.log("pic taken: " + result);
// })
// .catch((error) => {
//    // Handle your error
//    console.log(error);
// }); 
function createCamera(mode, oFileName, fileFormat, width, height, noPreview){
    let cameraObj = {
        mode: mode,
        output: `${__dirname}/${oFileName}.${fileFormat}`,
        width: width,
        height: height,
        nopreview: noPreview 
    },
        myCamera = new PiCamera(cameraObj);
    return myCamera;
}
function createVideo(mode, oFileName, fileFormat, width, height, timeout, noPreview){
    let cameraObj = {
        mode: mode,
        output: `${__dirname}/${oFileName}.${fileFormat}`,
        width: width,
        height: height,
        timeout: timeout,
        nopreview: noPreview 
    },
        myVideo = new PiCamera(cameraObj);
    return myVideo;
}
// can leave out 'end' and have the job run indefinitely after it's start time
// Note - the picture is taken 1 minute after the schedule job object is created
// var j = schedule.scheduleJob( 
//         {
//             start: startTime, 
//             // end: endTime, 
//             rule: '*/1 * * * *'  // execute the callback function below every minute
//         }, function(){
//             let mode = 'photo',
//                 oFileName = 'test',
//                 fileFormat = 'jpg',
//                 width = 640,
//                 height = 480,
//                 timeout = undefined,
//                 noPreview = true;
//             let myNewCamera = createCamera(mode, oFileName, fileFormat, width, height, timeout, noPreview);
//             myNewCamera.snap()
//             .then((result) => {
//               // Your picture was captured
//               console.log("pic taken: " + result);
//             })
//             .catch((error) => {
//                // Handle your error
//                console.log(error);
//             }); 
//         }
// );

let mode = 'video',
    oFileName = 'video',
    fileFormat = 'h264',
    width = 1980,
    height = 1080,
    timeout = 5000,
    noPreview = true;


// const myVideo = new PiCamera({
//   mode: mode,
//   output: `${ __dirname }/${oFileName}.${fileFormat}`,
//   width: width,
//   height: height,
//   timeout: timeout, // Record for 5 seconds
//   nopreview: noPreview,
// });
const myVideo = createVideo(mode, oFileName, fileFormat, width, height, timeout, noPreview);

myVideo.record()
.then((result) => {
    // Your video was captured
    console.log("pic taken: " + result);
})
.catch((error) => {
     // Handle your error
    console.log(error);
});