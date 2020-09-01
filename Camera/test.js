const PiCamera = require('pi-camera');

var schedule = require('node-schedule');
var date = new Date(2020, 7, 7, 18, 51, 0);

const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/test.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
});

var j = schedule.scheduleJob(date, function(){
    // this would schedule would be created at  18:51:00
    var x = schedule.scheduleJob('*/1 * * * *', function(){
        myCamera.snap()
        .then((result) => {
          // Your picture was captured
          console.log(result);
        })
        .catch((error) => {
           // Handle your error
           console.log(error);
        }); 
    })
});
