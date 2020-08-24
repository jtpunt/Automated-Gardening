var schedule = require('node-schedule');

var date = new Date(2020, 7, 7, 18, 51, 0);

var j = schedule.scheduleJob(date, function(){
    // this would schedule would be created at  18:51:00
    var x = schedule.scheduleJob('*/1 * * * *', function(){
        // this woudld execute at 8:52
        console.log(`This should execute every minute starting at: `, date);
    });
    // this would execute at 18:51
    console.log(`x: ${x.nextInvocation()}`);

});
// this would execute at some time before 8:51
console.log(`j: ${j.nextInvocation()}`);
