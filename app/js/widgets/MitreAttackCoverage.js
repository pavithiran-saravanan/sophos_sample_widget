let mitreAttackWidgetChart;

document.addEventListener('DOMContentLoaded', function () {
    mitreAttackWidgetChart = Highcharts.chart('mitreAttackWidgetChart', {
        chart: {
            polar: true,
            type: 'line'
        },
        title: {
            text: 'Mitre Att&ck Coverage'
        },
        pane: {
            size: '80%'
        },
        xAxis: {
            categories: [],
            tickmarkPlacement: 'on',
            lineWidth: 0
        },
        yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0
        },
        legend: {
            layout: 'vertical',  // Arrange legends vertically
            align: 'right',     // Align legend to the right
            verticalAlign: 'middle',  // Center vertically
        },
        series: [{
            name: 'Attack',
            colorByPoint: true,
            data: [],
            pointPlacement: 'on'
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        align: 'center',
                        verticalAlign: 'bottom',
                        layout: 'horizontal'
                    },
                    pane: {
                        size: '70%'
                    }
                }
            }]
        }
    });
});

function runDetectionsQuery() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/detections/v1/queries/detections`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
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

function getDetectionsResult() {
    return runDetectionsQuery().then(runDetectionResponse => {
        if (!runDetectionResponse || !runDetectionResponse.id) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        return fetch(`https://api-${dataRegion}.central.sophos.com/detections/v1/queries/detections/${runDetectionResponse.id}/results`, {
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
    });
}

export function getMitreAttackChartData() {

    getDetectionsResult().then(detections => {
        if (!detections || !detections.items) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        
        var mitreAttacks = [];
        var mitreTacticNames = [];
        
        detections.items.forEach(detection => {
            if (detection.mitreAttacks && detection.mitreAttacks.length > 0) {
                detection.mitreAttacks.forEach(attack => {
                    var existingMitreAttack = mitreAttacks.find(mitreAttack => mitreAttack.name === attack.tactic.name);
                    if (existingMitreAttack) {
                        existingMitreAttack.y += 1;
                    } else {
                        var mitreAttack = {
                            name: attack.tactic.name,
                            y: 1
                        };
                        mitreTacticNames.push(attack.tactic.name);
                        mitreAttacks.push(mitreAttack);
                    }
                });
                
            }
        });
        mitreAttackWidgetChart.xAxis[0].setCategories(mitreTacticNames)
        mitreAttackWidgetChart.series[0].setData(mitreAttacks);
    });
}

window.getMitreAttackChartData = getMitreAttackChartData;