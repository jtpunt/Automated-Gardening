var schedule = require('node-schedule');

// var date = new Date(2020, 7, 7, 18, 51, 0);

// var j = schedule.scheduleJob(date, function(){
//     // this would schedule would be created at  18:51:00
//     var x = schedule.scheduleJob('*/1 * * * *', function(){
//         // this woudld execute at 8:52
//         console.log(`This should execute every minute starting at: `, date);
//     });
//     // this would execute at 18:51
//     console.log(`x: ${x.nextInvocation()}`);

// });

let startTime = new Date(Date.now() + 5000);
let endTime = new Date(startTime.getTime() + 5000);
let initialState = true;
var j = schedule.scheduleJob(
		{
			start: startTime, 
			end: endTime, 
			rule: '*/1 * * * * *' 
		}, function(){
  			console.log('Time for tea!: ' + initialState);
  			initialState = !initialState;
		}
);
// this would execute at some time before 8:51
console.log(`j: ${j.nextInvocation()}`);

