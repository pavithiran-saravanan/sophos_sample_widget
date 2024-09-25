let regionalProtectionScoreChart;

document.addEventListener('DOMContentLoaded', function () {
    regionalProtectionScoreChart = Highcharts.mapChart('regionalProtectionScoreWidgetChart', {
        chart: {
            map: 'custom/world'
        },

        credits: {
            enabled: false
        },

        title: {
            text: 'Regional Protection Score',
            align: 'left'
        },

        subtitle: {
            text: ''
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        colorAxis: {
            dataClasses: [{
                from: 0,
                to: 49,
                color: '#2ECC71',
                name: 'Low'
            }, {
                from: 50,
                to: 74,
                color: '#F1C40F',
                name: 'Medium'
            }, {
                from: 75,
                to: 99,
                color: '#E67E22',
                name: 'High'
            }, {
                from: 100,
                color: '#E74C3C',
                name: 'Critical'
            }]
        },

        legend: {
            title: {
                text: '',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                }
            },
            align: 'center',
            verticalAlign: 'bottom',
            floating: false,
            layout: 'horizontal',
            valueDecimals: 0
        },

        series: [{
            name: 'Countries',
            mapData: Highcharts.maps['custom/world'],
            borderColor: '#A0A0A0',
            nullColor: 'rgba(200, 200, 200, 0.3)',
            showInLegend: false
        }, {
            type: 'mapbubble',
            name: 'Score',
            joinBy: ['iso-a2', 'code'], // Using 'iso-a2' as join key
            data: [
                { code: 'IN', z: 30, name: 'India', score: 'low' },
                { code: 'US', z: 60, name: 'USA', score: 'medium' },
                { code: 'RU', z: 90, name: 'Russia', score: 'high' },
                { code: 'AU', z: 120, name: 'Australia', score: 'critical' }
            ],
            minSize: 10,
            maxSize: '15%',
            tooltip: {
                pointFormat: '{point.name}: {point.z} (Score: {point.score})'
            }
        }]
    });
});

function runDetectionsQuery() {
}

function getDetectionsResult() {
}

export function getRegionalProtectionScoreChartData() {
}

window.getRegionalProtectionScoreChartData = getRegionalProtectionScoreChartData;