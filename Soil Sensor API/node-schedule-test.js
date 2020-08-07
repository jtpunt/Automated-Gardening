var schedule = require('node-schedule');

var j = schedule.scheduleJob('* */5 * * *', function(){
  console.log('This should execute every 5 hours');
});
console.log(j);

console.log(`Every 5 Hours: ${j.nextInvocation()}`);

j.reschedule('*/5 * * * *');

console.log(`Every 5 minutes: ${j.nextInvocation()}`);