const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let userClicksOnRiskyLinksChart;

document.addEventListener('DOMContentLoaded', function () {
    userClicksOnRiskyLinksChart = Highcharts.chart('userClicksOnRiskyLinksWidgetChart', {
        chart: {
            type: 'heatmap'
        },
    
        title: {
            text: 'User Clicks on Risky Links',
        },
    
        accessibility: {
            landmarkVerbosity: 'one'
        },
    
        tooltip: {
            enabled: true,
            outside: true,
            zIndex: 20,
            headerFormat: '',
            pointFormat: '{#unless point.custom.empty}{point.date:%A, %b %e, ' +
                '%Y}{/unless}',
            nullFormat: 'No data'
        },
    
        xAxis: {
            categories: weekdays,
            opposite: true,
            lineWidth: 26,
            offset: 13,
            lineColor: 'rgba(27, 26, 37, 0.2)',
            labels: {
                rotation: 0,
                y: 20,
                style: {
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                }
            },
            accessibility: {
                description: 'weekdays',
                rangeDescription: 'X Axis is showing all 7 days of the week, ' +
                    'starting with Sunday.'
            }
        },
    
        yAxis: {
            min: 0,
            max: 5,
            accessibility: {
                description: 'weeks'
            },
            visible: false
        },
    
        legend: {
            align: 'right',
            layout: 'vertical',
            verticalAlign: 'middle'
        },
    
        colorAxis: {
            min: 0,
            stops: [
                [0.2, 'lightblue'],
                [0.4, '#CBDFC8'],
                [0.6, '#F3E99E'],
                [0.9, '#F9A05C']
            ],
            labels: {
                format: '{value} °C'
            }
        },
    
        series: [{
            keys: ['x', 'y', 'value', 'date', 'id'],
            data: [],
            nullColor: 'rgba(196, 196, 196, 0.2)',
            borderWidth: 2,
            borderColor: 'rgba(196, 196, 196, 0.2)',
            dataLabels: [{
                enabled: true,
                format: '{#unless point.custom.empty}{point.value:.1f}°{/unless}',
                style: {
                    textOutline: 'none',
                    fontWeight: 'normal',
                    fontSize: '1rem'
                },
                y: 4
            }, {
                enabled: true,
                align: 'left',
                verticalAlign: 'top',
                format: '{#unless ' +
                    'point.custom.empty}{point.custom.monthDay}{/unless}',
                backgroundColor: 'whitesmoke',
                padding: 2,
                style: {
                    textOutline: 'none',
                    color: 'rgba(70, 70, 92, 1)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    opacity: 0.5
                },
                x: 1,
                y: 1
            }]
        }]
    });
});

function getEvents() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/siem/v1/events?limit=200`, {
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

function getUserClicksOnRiskyLinks() {
    var eventsData = [];
    return getEvents().then(events => {
        if (!events || !events.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        events.items.forEach(event => {
            if (event.type == 'Event::Endpoint::WebControlViolation') {
                var eventDate = event.date.split("T")[0]
                var existingEventData = eventsData.find(eventData => eventData.date === eventDate);
                if (existingEventData) {
                    existingEventData.clickCount += 1;
                } else {
                    var eventData = {
                        date: eventDate,
                        clickCount: 1
                    };
                    eventsData.push(eventData);
                }
            }
        });
        return eventsData;
    });
}

function generateGetUserClicksOnRiskyLinksChartData(data) {

    if (!data || data.length <= 0) {
        return [];
    }

    // Calculate the starting weekday index (0-6 of the first date in the given
    // array)
    const firstWeekday = new Date(data[0].date).getDay(),
        monthLength = data.length,
        lastElement = data[monthLength - 1].date,
        lastWeekday = new Date(lastElement).getDay(),
        lengthOfWeek = 6,
        emptyTilesFirst = firstWeekday,
        chartData = [];

    // Add the empty tiles before the first day of the month with null values to
    // take up space in the chart
    for (let emptyDay = 0; emptyDay < emptyTilesFirst; emptyDay++) {
        chartData.push({
            x: emptyDay,
            y: 5,
            value: null,
            date: null,
            custom: {
                empty: true
            }
        });
    }

    // Loop through and populate with clickCount and dates from the dataset
    for (let day = 1; day <= monthLength; day++) {
        // Get date from the given data array
        const date = data[day - 1].date;
        // Offset by thenumber of empty tiles
        const xCoordinate = (emptyTilesFirst + day - 1) % 7;
        const yCoordinate = Math.floor((firstWeekday + day - 1) / 7);
        const id = day;

        // Get the corresponding clickCount for the current day from the given
        // array
        const clickCount = data[day - 1].clickCount;

        chartData.push({
            x: xCoordinate,
            y: 5 - yCoordinate,
            value: clickCount,
            date: new Date(date).getTime(),
            custom: {
                monthDay: id
            }
        });
    }

    // Fill in the missing values when dataset is looped through.
    const emptyTilesLast = lengthOfWeek - lastWeekday;
    for (let emptyDay = 1; emptyDay <= emptyTilesLast; emptyDay++) {
        chartData.push({
            x: (lastWeekday + emptyDay) % 7,
            y: 0,
            value: null,
            date: null,
            custom: {
                empty: true
            }
        });
    }
    return chartData;
}

export function getUserClicksOnRiskyLinksChartData() {

    getUserClicksOnRiskyLinks().then(userClicks => {
        if (!userClicks) {
            console.error('User Clicks response is undefined');
            return;
        }
        var chartData = generateGetUserClicksOnRiskyLinksChartData([{
            date: '2023-07-01',
            clickCount: 19.1
        },
        {
            date: '2023-07-02',
            clickCount: 15.3
        },
        {
            date: '2023-07-03',
            clickCount: 16.4
        },
        {
            date: '2023-07-04',
            clickCount: 16.0
        },
        {
            date: '2023-07-05',
            clickCount: 17.9
        },
        {
            date: '2023-07-06',
            clickCount: 15.8
        },
        {
            date: '2023-07-07',
            clickCount: 21.1
        },
        {
            date: '2023-07-08',
            clickCount: 23.3
        },
        {
            date: '2023-07-09',
            clickCount: 24.8
        },
        {
            date: '2023-07-10',
            clickCount: 25.1
        },
        {
            date: '2023-07-11',
            clickCount: 18.2
        },
        {
            date: '2023-07-12',
            clickCount: 14.4
        },
        {
            date: '2023-07-13',
            clickCount: 19.3
        },
        {
            date: '2023-07-14',
            clickCount: 20.2
        },
        {
            date: '2023-07-15',
            clickCount: 15.8
        },
        {
            date: '2023-07-16',
            clickCount: 16.1
        },
        {
            date: '2023-07-17',
            clickCount: 15.7
        },
        {
            date: '2023-07-18',
            clickCount: 19.2
        },
        {
            date: '2023-07-19',
            clickCount: 18.6
        },
        {
            date: '2023-07-20',
            clickCount: 18.3
        },
        {
            date: '2023-07-21',
            clickCount: 15.0
        },
        {
            date: '2023-07-22',
            clickCount: 14.7
        },
        {
            date: '2023-07-23',
            clickCount: 18.8
        },
        {
            date: '2023-07-24',
            clickCount: 17.7
        },
        {
            date: '2023-07-25',
            clickCount: 17.4
        },
        {
            date: '2023-07-26',
            clickCount: 17.6
        },
        {
            date: '2023-07-27',
            clickCount: 18.1
        },
        {
            date: '2023-07-28',
            clickCount: 18.2
        },
        {
            date: '2023-07-29',
            clickCount: 20.3
        },
        {
            date: '2023-07-30',
            clickCount: 16.4
        },
        {
            date: '2023-07-31',
            clickCount: 17.0
        }]);
        userClicksOnRiskyLinksChart.series[0].setData(chartData);
    });
}

window.getUserClicksOnRiskyLinksChartData = getUserClicksOnRiskyLinksChartData;