var schedule = require('node-schedule');

var j = schedule.scheduleJob('* */1 * * *', function(){
  console.log('This should execute every hour');
});
console.log(j);

console.log(`Every 1 Hours: ${j.nextInvocation()}`);

j.reschedule('*/1 * * * *');

console.log(`Every 1 minutes: ${j.nextInvocation()}`);