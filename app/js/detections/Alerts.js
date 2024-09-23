let alertsWidgetChartData;

// Display alertsWidgetChart once the DOM content is loaded
document.addEventListener('DOMContentLoaded', function () {
    alertsWidgetChartData = Highcharts.chart('alertsWidgetChart', {
        chart: {
            type: 'pie'
        },
        title: {
            text: 'Alerts'
        },
        credits: {
            enabled: false
        },
        colors: ['#80BB4F', '#FFB738', '#DD3F3E'],  // Specify colors for each segment
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
                { name: 'Low', y: 1 }, // Initial placeholder data
                { name: 'Medium', y: 1 },
                { name: 'High', y: 1 }
            ]
        }]
    });
});

// Handle API request
function queryEndpoints() {
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
        console.log('Success: Alerts Data:', data);
        return data;
    }).catch(error => {
        console.error('Error:', error);
    });
};

// Method to fetch alertsWidgetChartData
export function getalertsWidgetChartData() {
    let alertsData = []
    queryEndpoints().then((alerts)=>{
        if (!alerts || !alerts.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        let low = 0, medium = 0, high = 0;
        alerts.items.forEach(item => {
            if(item.severity === "low") low++;
            if(item.severity === "medium") medium++;
            if(item.severity === "high") high++;
        });
        let alertsCountData = [
            { name: 'Low', y: low }, 
            { name: 'Medium', y: medium },
            { name: 'High', y: high }
        ]
        alertsWidgetChartData.series[0].setData([low, medium, high]);
    })
}

window.getalertsWidgetChartData = getalertsWidgetChartData;