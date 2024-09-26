let healthScoresChartData;
let protectionScoreChartData;
let policyThreatProtectionScoreChartData;
let exclusionScoreChartData;
let tamperProtectionScoreChartData;
let updating = false;

document.addEventListener('DOMContentLoaded', function () {
    // Widget 1 - Threat Protection Score
    protectionScoreChartData = Highcharts.chart('protectionScoreChart', {
        title: {
            text: 'Protection Score',
            align: 'left'
        },
        subtitle: {
            text: `<div style='font-size: 40px'>10</div>`,
            align: "center",
            verticalAlign: "middle",
            style: {
                "textAlign": "center"
            },
            x: 0,
            y: 20,
            useHTML: true
        },
        series: [{
            type: 'pie',
            enableMouseTracking: false,
            innerSize: '85%',
            dataLabels: {
                enabled: false
            },
            data: [{
                y: 10,
                color: '#62acfc'
            }, {
                y: 90,
                color: 'whitesmoke'
            }, {  // A small white circle at the end of the progress
                y: 0.5, 
                color: '#FFFFFF',
                borderColor: '#FFFFFF',
                dataLabels: {
                    enabled: false
                },
                size: '100%',
                innerSize: '80%'
            }]
        }],
        chart: {
            events: {
                redraw: function () {
                    if (!updating) {
                        updating = true;
                        const chart = this;
                        const actualValue = chart.series[0].data[0].y; // Get the first slice's y value (e.g., 10)
                        chart.update({
                            subtitle: {
                                text: `<div style='font-size: 50px'>${actualValue}</div>`
                            }
                        }); 
                        updating = false;
                    }
                }
            }
        }
    });

    // Widget 2 - Policy Threat Protection Score 
    policyThreatProtectionScoreChartData = Highcharts.chart('policyThreatProtectionScoreChart', {
        title: {
            text: 'Protection Score',
            align: 'left'
        },
        subtitle: {
            text: `<div style='font-size: 40px'>10</div>`,
            align: "center",
            verticalAlign: "middle",
            style: {
                "textAlign": "center"
            },
            x: 0,
            y: 20,
            useHTML: true
        },
        series: [{
            type: 'pie',
            enableMouseTracking: false,
            innerSize: '85%',
            dataLabels: {
                enabled: false
            },
            data: [{
                y: 10,
                color: '#ae8f0c'
            }, {
                y: 90,
                color: 'whitesmoke'
            }]
        }],
        chart: {
            events: {
                redraw: function () {
                    if (!updating) {
                        updating = true;
                        const chart = this;
                        const actualValue = chart.series[0].data[0].y; // Get the first slice's y value (e.g., 10)
                        chart.update({
                            subtitle: {
                                text: `<div style='font-size: 50px'>${actualValue}</div>`
                            }
                        }); 
                        updating = false;
                    }
                }
            }
        }
    });

    // Widget 3 - Exclusion Score 
    exclusionScoreChartData = Highcharts.chart('exclusionScoreChart', {
        title: {
            text: 'Protection Score',
            align: 'left'
        },
        subtitle: {
            text: `<div style='font-size: 40px'>10</div>`,
            align: "center",
            verticalAlign: "middle",
            style: {
                "textAlign": "center"
            },
            x: 0,
            y: 20,
            y: 20,
            useHTML: true
        },
        series: [{
            type: 'pie',
            enableMouseTracking: false,
            innerSize: '85%',
            dataLabels: {
                enabled: false
            },
            data: [{
                y: 10,
                color: '#256dc3'
            }, {
                y: 90,
                color: 'whitesmoke'
            }]
        }],
        chart: {
            events: {
                redraw: function () {
                    if (!updating) {
                        updating = true;
                        const chart = this;
                        const actualValue = chart.series[0].data[0].y; // Get the first slice's y value (e.g., 10)
                        chart.update({
                            subtitle: {
                                text: `<div style='font-size: 50px'>${actualValue}</div>`
                            }
                        }); 
                        updating = false;
                    }
                }
            }
        }
    });

    // Widget 4 - Tamper Protection Score 
    tamperProtectionScoreChartData = Highcharts.chart('tamperProtectionScoreChart', {
        title: {
            text: 'Protection Score',
            align: 'left'
        },
        subtitle: {
            text: `<div style='font-size: 40px'>10</div>`,
            align: "center",
            verticalAlign: "middle",
            style: {
                "textAlign": "center"
            },
            x: 0,
            y: 20,
            useHTML: true
        },
        series: [{
            type: 'pie',
            enableMouseTracking: false,
            innerSize: '85%',
            dataLabels: {
                enabled: false
            },
            data: [{
                y: 10,
                color: '#ec0b50'
            }, {
                y: 90,
                color: 'whitesmoke'
            }]
        }],
        chart: {
            events: {
                redraw: function () {
                    if (!updating) {
                        updating = true;
                        const chart = this;
                        const actualValue = chart.series[0].data[0].y; // Get the first slice's y value (e.g., 10)
                        chart.update({
                            subtitle: {
                                text: `<div style='font-size: 50px'>${actualValue}</div>`
                            }
                        }); 
                        updating = false;
                    }
                }
            }
        }
    });
});

function runHealthCheckQuery() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/account-health-check/v1/health-check`, {
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

function setProtectionScore(score){
    protectionScoreChartData.series[0].setData([score, 100-score]);
}

function setPolicyProtectionScore(score){
    policyThreatProtectionScoreChartData.series[0].setData([score, 100-score]);
}

function setExclustionScore(score){
    exclusionScoreChartData.series[0].setData([score, 100-score]);
}

function setTamperProtectionScore(score){
    tamperProtectionScoreChartData.series[0].setData([score, 100-score]);
}

export function getHealthScoresChartData() {
    runHealthCheckQuery().then(scoresData => {
        const protectionScore = scoresData.endpoint.protection.computer.score;
        const policyThreatProtectionScore = scoresData.endpoint.policy.server['server-threat-protection'].score;
        const exclusionScore = scoresData.endpoint.exclusions.global.score;
        const tamperProtectionScore = scoresData.endpoint.tamperProtection.globalDetail.score;
        setProtectionScore(protectionScore);
        setPolicyProtectionScore(policyThreatProtectionScore);
        setExclustionScore(exclusionScore);
        setTamperProtectionScore(tamperProtectionScore);
    })
}

window.getHealthScoresChartData = getHealthScoresChartData;