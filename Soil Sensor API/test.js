const mcpadc = require('mcp-spi-adc');
 
const soilSensor = mcpadc.openMcp3008(0, (err) => {
  if (err) throw err;
 
  setInterval(() => {
    soilSensor.read((err, reading) => {
      if (err) throw err;
 
      console.log(reading.value * 1000);
    });
  }, 1000);
});
