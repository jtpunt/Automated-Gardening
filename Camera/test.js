const PiCamera = require('pi-camera');
let schedule = require('node-schedule');

let startTime = new Date(Date.now() + 2000),
    endTime = new Date(startTime.getTime() + 1*60*60*1000),
    date  = new Date(Date.now() + 2000);

const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/test.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
});
myCamera.snap()
.then((result) => {
  // Your picture was captured
  console.log("pic taken: " + result);
})
.catch((error) => {
   // Handle your error
   console.log(error);
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
// var j = schedule.scheduleJob(
//         {
//             start: startTime, 
//             end: endTime, 
//             rule: '*/5 * * * * *' 
//         }, function(){
//             let mode = 'photo',
//                 outputFileName = 'test' + Math.random(),
//                 fileFormat = 'jpg',
//                 width = 640,
//                 height = 480,
//                 noPreview = true;
//             let myNewCamera = createCamera(mode, outputFileName, fileFormat, width, height, noPreview);
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
// this would execute at some time before 8:51
// console.log(`j: ${j.nextInvocation()}`);
// var j = schedule.scheduleJob(date, function(){
//     // this would schedule would be created at  18:51:00
//     var x = schedule.scheduleJob('*/1 * * * *', function(){
//         let mode = 'photo',
//             outputFileName = 'test' + Math.random(),
//             fileFormat = 'jpg',
//             width = 640,
//             height = 480,
//             noPreview = true;
//         let myNewCamera = createCamera(mode, outputFileName, fileFormat, width, height, noPreview);
//         //myCamera.snap()
//         myNewCamera.snap()
//         .then((result) => {
//           // Your picture was captured
//           console.log("pic taken: " + result);
//         })
//         .catch((error) => {
//            // Handle your error
//            console.log(error);
//         }); 
//     })
// });
