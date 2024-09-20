let topAlertsWidgetChart;

document.addEventListener('DOMContentLoaded', function () {
    topAlertsWidgetChart = Highcharts.chart('topAlertsWidgetChart', {
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Top Alerts'
        },
        plotOptions: {
            pie: {
                innerSize: '0%',  // Makes it a donut chart
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true  // Disable data labels
                }
            }
        },
        legend: {
            enabled: true,  // Ensure the legend is enabled
            layout: 'vertical',  // Arrange legends vertically
            align: 'right',     // Align legend to the right
            verticalAlign: 'middle',  // Center vertically
            x: -50,  // X position of the legend
            y: 0     // Y position of the legend
        },
        series: [{
            name: 'Endpoints',
            colorByPoint: true,
            data: []
        }]
    });
});

function getAlerts() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/siem/v1/alerts?limit=200`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantID
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    }).then(data => {
        console.log('Success:', data);
        return data;
    }).catch(error => {
        console.error('Error:', error);
    });
}

export function getTopAlertsChartData() {
    var alertsData = [];
    getAlerts().then(alerts => {
        if (!alerts || !alerts.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        alerts.items.forEach(alert => {
            var existingAlertData = alertsData.find(alertData => alertData.name === alert.type);
            if (existingAlertData) {
                existingAlertData.y += 1;
            } else {
                var alertData = {
                    name: alert.type,
                    y: 0
                };
                alertsData.push(alertData);
            }
        });
        topAlertsWidgetChart.series[0].setData(alertsData);
    });
}

window.getTopAlertsChartData = getTopAlertsChartData;