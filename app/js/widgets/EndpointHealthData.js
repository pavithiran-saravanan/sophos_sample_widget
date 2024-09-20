let endpointHealthDataWidgetChart;

document.addEventListener('DOMContentLoaded', function () {
    endpointHealthDataWidgetChart = Highcharts.chart('endpointHealthDataWidgetChart', {
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Endpoint Health Data'
        },
        colors: ['#FFB738', '#DD3F3E', '#80BB4F'],  // Specify colors for each segment
        plotOptions: {
            pie: {
                innerSize: '70%',  // Makes it a donut chart
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false  // Disable data labels
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
            data: [
                { name: 'Suspicious', y: 0 }, // Initial placeholder data
                { name: 'Bad', y: 0 },
                { name: 'Good', y: 0 }
            ]
        }]
    });
});

function queryEndpoints() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/endpoint/v1/endpoints`, {
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
};

export function getEndpointsByHealthChartData() {
    queryEndpoints().then(endpointDetails => {
        if (!endpointDetails || !endpointDetails.items) {
            console.error('Endpoint details or items are undefined');
            return;
        }
        var endpointsHealthData = {
            good: 0,
            suspicious: 0,
            bad: 0
        };
        endpointDetails.items.forEach(element => {
            if (element.health.overall == 'good') {
                endpointsHealthData.good = endpointsHealthData.good + 1;
            } else if (element.health.overall == 'bad') {
                endpointsHealthData.bad = endpointsHealthData.bad + 1;
            } else {
                endpointsHealthData.suspicious = endpointsHealthData.suspicious + 1;
            }
        });
        endpointHealthDataWidgetChart.series[0].setData([endpointsHealthData.suspicious, endpointsHealthData.bad, endpointsHealthData.good]);
    });
}

window.getEndpointsByHealthChartData = getEndpointsByHealthChartData;