const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let userClicksOnRiskyLinksChart;

document.addEventListener('DOMContentLoaded', function () {
    userClicksOnRiskyLinksChart = Highcharts.chart('userClicksOnRiskyLinksWidgetChart', {
        chart: {
            type: 'heatmap'
        },

        credits: {
            enabled: false
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
                format: '{value:.0f}'
            },
        },
    
        series: [{
            keys: ['x', 'y', 'value', 'date', 'id'],
            data: [],
            nullColor: 'rgba(196, 196, 196, 0.2)',
            borderWidth: 2,
            borderColor: 'rgba(196, 196, 196, 0.2)',
            dataLabels: [{
                enabled: true,
                format: '{#unless point.custom.empty}{point.value}{/unless}',
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
                var eventDate = event.created_at.split("T")[0];
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
    // Calculate the starting weekday index (0-6 of the first date in the given array)
    const firstWeekday = new Date(data[0].date).getDay(),
        monthLength = data.length,
        lastElement = data[monthLength - 1].date,
        lastWeekday = new Date(lastElement).getDay(),
        lengthOfWeek = 6,
        emptyTilesFirst = firstWeekday,
        chartData = [];

    // Add the empty tiles before the first day of the month with null values
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
    
    let yCoordinate = 0;
    // Loop through and populate with clickCount and dates from the dataset
    for (let day = 1; day <= monthLength; day++) {
        // Get date from the given data array
        const date = data[day - 1].date;
        // Offset by thenumber of empty tiles
        const xCoordinate = (emptyTilesFirst + day - 1) % 7;
        yCoordinate = Math.floor((firstWeekday + day - 1) / 7);
        const id = day;
        // Get the corresponding clickCount for the current day from the given
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

    // Fill in the missing values at current row
    const emptyTilesLast = lengthOfWeek - lastWeekday;
    for (let emptyDay = 1; emptyDay <= emptyTilesLast; emptyDay++) {
        chartData.push({
            x: (lastWeekday + emptyDay) % 7,
            y: 5 - yCoordinate,
            value: null,
            date: null,
            custom: {
                empty: true
            }
        });
    }

    // Fill in the missing rows
    // yCoordinate++;
    // while(yCoordinate < 6){
    //     for (let xValue = 0; xValue <= lengthOfWeek; xValue++) {
    //         chartData.push({
    //             x: xValue,
    //             y: 5 - yCoordinate,
    //             value: null,
    //             date: null,
    //             custom: {
    //                 empty: true
    //             }
    //         });
    //     }
    //     yCoordinate++;
    // }    
    return chartData;
}

function generateMonthlyUserClicksOnRiskyLinks(providedData = []) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // Adding 1 to get the correct month number (1 for January, 12 for December)
    // Get the number of days in the current month
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = today.getDate(); // Get today's day in the month
    // Convert providedData to a map for easy lookup
    const providedDataMap = providedData.reduce((map, entry) => {
        map[entry.date] = entry.clickCount;
        return map;
    }, {});
    const result = [];
    // Loop through all the days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        // Format the date as 'YYYY-MM-DD'
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Use the clickCount from providedData if available, otherwise default to 0
        const clickCount = providedDataMap[date] || 0;

        result.push({
            date: date,
            clickCount: clickCount
        });
    }
    return result;
}

export function getUserClicksOnRiskyLinksChartData() {
    getUserClicksOnRiskyLinks().then(userClicks => {
        if (!userClicks) {
            console.error('User Clicks response is undefined');
            return;
        }
        const chartData = generateGetUserClicksOnRiskyLinksChartData(generateMonthlyUserClicksOnRiskyLinks(userClicks));
        userClicksOnRiskyLinksChart.series[0].setData(chartData);
    });
}

window.getUserClicksOnRiskyLinksChartData = getUserClicksOnRiskyLinksChartData;