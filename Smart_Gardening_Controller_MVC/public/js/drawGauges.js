document.onreadystatechange = () => {
    var state = document.readyState
    if (state == 'interactive') {
        console.log('interactive');
        document.getElementById('contents').style.visibility="hidden";
    }else if (state == 'complete') {
        setTimeout(() => {
            document.getElementById('interactive');
            document.getElementById('load').style.visibility="hidden";
            document.getElementById('contents').style.visibility="visible";
        },1000);
    }
}
var tempOptions = {
    width: 400, height: 200,
    greenFrom: 60, greenTo: 80,
    redFrom: 80, redTo: 100,
    minorTicks: 5
};
var humidOptions = {
    width: 400, height: 200,
    greenFrom: 40, greenTo: 80,
    redFrom: 80, redTo: 100,
    minorTicks: 5
};
function drawGauge(sensorData, options, gaugeID) {
    let gaugeOptions = (options) ? humidOptions : tempOptions;
    let label = (options) ? "HUM %" : "TEMP ";
    google.charts.load('current', {'packages':['gauge'], callback: () => {
        gaugeData = new google.visualization.DataTable();
        gaugeData.addColumn('number', label);
        gaugeData.addRows(2);
        gauge = new google.visualization.Gauge(document.getElementById(gaugeID));
        
        // if our temp or humid value is greater than 0, set extra options to animate our gauge to start from 0 to our temp or humid value
        if(sensorData > 0){
            console.log("sensorData > 0");
            gaugeOptions['animation'] = {
                duration: 10000,
                easing: 'out',
             }   
            gaugeData.setCell(0, 0, "0");
            gauge.draw(gaugeData, gaugeOptions);
        }
        gaugeData.setCell(0, 0, sensorData);
        gauge.draw(gaugeData, gaugeOptions);
        console.log(sensorData);

    }});
}
