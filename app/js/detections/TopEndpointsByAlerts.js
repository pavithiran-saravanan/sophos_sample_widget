let topEndpointsByAlerts;

document.addEventListener('DOMContentLoaded', function () {
    topEndpointsByAlerts = Highcharts.chart('topEndpointsByAlertsWidgetChart', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Top Endpoints By Alerts',
            align: 'left'
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories: []
        },
        colors: ['#e47c4c', '#e4cd48', '#e44c4c'],
        yAxis: {
            min: 0,
            title: {
                text: ''
            },
            stackLabels: {
                enabled: false
            }
        },
        legend: {
            align: 'left',
            x: 70,
            verticalAlign: 'top',
            y: 70,
            floating: true,
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: false
                }
            }
        },
        series: [{
            name: 'High',
            data: []
        }, {
            name: 'Medium',
            data: []
        }, {
            name: 'Low',
            data: []
        },]
    });
});

function queryAlerts() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/siem/v1/alerts?limit=500`, {
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

export function getTopEndpointsByAlertsChartData() {
    let alertsData = []
    queryAlerts().then(alerts => {
        queryEndpoints().then((endpoints) => {
            let endpointsMap = {};
            endpoints.items.forEach(endpoint => {
                endpointsMap[endpoint.id] = {name: endpoint.hostname, low: 0, medium: 0, high: 0};
            });
            alerts.items.forEach(item=>{
                endpointsMap[item.data.endpoint_id][item.severity]++;
            })

            const sortedEndpoints = Object.entries(endpointsMap).map(entry => entry[1])
            .sort((a, b) => (b.low + b.medium + b.high) - (a.low + a.medium + a.high))
            .slice(0, 5);
            
            let categories = [];
            let lowDataArray = [];
            let mediumDataArray = [];
            let highDataArray = [];
            
            sortedEndpoints.forEach(endpoint => {
                categories.push(endpoint.name);
                lowDataArray.push(endpoint.low);
                mediumDataArray.push(endpoint.medium);
                highDataArray.push(endpoint.high);
            });

            topEndpointsByAlerts.axes[0].categories = categories;
            topEndpointsByAlerts.series[0].setData(lowDataArray);
            topEndpointsByAlerts.series[1].setData(mediumDataArray);
            topEndpointsByAlerts.series[2].setData(highDataArray);
        })
    })
}

window.getTopEndpointsByAlertsChartData = getTopEndpointsByAlertsChartData;