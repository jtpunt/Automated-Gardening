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
function drawGauge(temp, options, gaugeID) {
    let gaugeOptions = (options) ? humidOptions : tempOptions;
    let label = (options) ? "HUM %" : "TEMP ";
    google.charts.load('current', {'packages':['gauge'], callback: () => {
        gaugeData = new google.visualization.DataTable();
        gaugeData.addColumn('number', label);
        gaugeData.addRows(2);
        gaugeData.setCell(0, 0, temp);
        gauge = new google.visualization.Gauge(document.getElementById(gaugeID));
        gauge.draw(gaugeData, gaugeOptions);
    }});
}
