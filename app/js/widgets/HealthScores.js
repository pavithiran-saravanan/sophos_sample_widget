let healthScoresChartData;
let protectionScoreChartData;
let plicyThreatProtectionScoreChartData;
let exclusionScoreChartData;
let tamperProtectionScoreChartData;

document.addEventListener('DOMContentLoaded', function () {
    // Widget 1 - Protection Score
    protectionScoreChartData = Highcharts.chart('protectionScoreChart', {
        title: {
            text: 'Protection Score',
            align: 'left'
        },
        subtitle: {
            text: `<div style='font-size: 40px'>10%</div>`,
            align: "center",
            verticalAlign: "middle",
            style: {
                "textAlign": "center"
            },
            x: 0,
            useHTML: true
        },
        series: [{
            type: 'pie',
            enableMouseTracking: false,
            innerSize: '80%',
            dataLabels: {
                enabled: false
            },
            data: [{
                y: 10,
                color: '#21aeeb'
            }, {
                y: 90,
                color: 'whitesmoke'
            }]
        }],
        // This function will update the subtitle with the actual data value dynamically
        chart: {
            events: {
                load: function () {
                    const chart = this;
                    const actualValue = chart.series[0].data[0].y; // Get the first slice's y value (e.g., 10)
                    chart.update({
                        subtitle: {
                            text: `<div style='font-size: 40px'>${actualValue}%</div>`
                        }
                    });
                }
            }
        }
    });

    // Widget 2 - Policy Threat Protection Score
    plicyThreatProtectionScoreChartData = Highcharts.chart('plicyThreatProtectionScoreChart', {
        title: {
          text: 'Policy Threat Protection Score',
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
          useHTML: true
        },
        series: [{
          type: 'pie',
          enableMouseTracking: false,
          innerSize: '80%',
          dataLabels: {
            enabled: false
          },
          data: [{
            y: 10,
            color: '#d17d0f'
          }, {
            y: 90,
            color: 'whitesmoke'
          }]
        }]
      });

    // Widget 3 - Exclusion Score
    exclusionScoreChartData = Highcharts.chart('exclusionScoreChart', {
        title: {
          text: 'Exclusion Score',
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
          useHTML: true
        },
        series: [{
          type: 'pie',
          enableMouseTracking: false,
          innerSize: '80%',
          dataLabels: {
            enabled: false
          },
          data: [{
            y: 10,
            color: '#085aa6'
          }, {
            y: 90,
            color: 'whitesmoke'
          }]
        }]
      });

    // Widget 4 - Tamper Protection Score
    tamperProtectionScoreChartData = Highcharts.chart('tamperProtectionScoreChart', {
        title: {
          text: 'Tamper Protection Score',
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
          useHTML: true
        },
        series: [{
          type: 'pie',
          enableMouseTracking: false,
          innerSize: '80%',
          dataLabels: {
            enabled: false
          },
          data: [{
            y: 10,
            color: '#a6084a'
          }, {
            y: 90,
            color: 'whitesmoke'
          }]
        }]
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
    plicyThreatProtectionScoreChartData.series[0].setData([score, 100-score]);

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
        const policyThreatProtectionScore = scoresData.endpoint.policy.server['server-threat-protection'];
        const exclusionScore = scoresData.endpoint.protection.computer.score;
        const tamperProtectionScore = scoresData.endpoint.protection.computer.score;
        setProtectionScore(protectionScore);
        setPolicyProtectionScore(policyThreatProtectionScore);
        setExclustionScore(exclusionScore);
        setTamperProtectionScore(tamperProtectionScore);
    })
}

window.getHealthScoresChartData = getHealthScoresChartData;