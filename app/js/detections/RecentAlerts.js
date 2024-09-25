let recentAlerts;

document.addEventListener('DOMContentLoaded', function () {
    
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

function parseTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Month is zero-based, so add 1
    const day = ('0' + date.getDate()).slice(-2); // Zero-pad the day
    const hours = ('0' + date.getHours()).slice(-2); // Zero-pad the hours
    const minutes = ('0' + date.getMinutes()).slice(-2); // Zero-pad the minutes
    const seconds = ('0' + date.getSeconds()).slice(-2); // Zero-pad the seconds
    const formattedDate = `${year}:${month}:${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    return {
        date: formattedDate,
        time: formattedTime
    };
}

function createAlertItem(alert) {
    const title = alert.type;
    const description = alert.description;
    const severity = alert.severity;
    const dateTime = parseTimestamp(alert.created_at);

    const div = document.createElement('div');
    div.classList.add('alertItem');
    div.classList.add(severity);

    const titleElement = document.createElement('div');
    titleElement.classList.add('alertItemTitle');
    titleElement.textContent = title;

    const descriptionElement = document.createElement('div');
    descriptionElement.textContent = description;
    descriptionElement.classList.add('alertItemDescription');

    const time = document.createElement('div');
    time.classList.add('alertItemTime');
    time.textContent = dateTime.time;
    const date = document.createElement('div');
    date.classList.add('alertItemDate');
    date.textContent = dateTime.date;

    div.appendChild(titleElement);
    div.appendChild(descriptionElement);
    div.appendChild(time);
    div.appendChild(date);
    
    return div; 
}

export function getRecentAlertsData() {
    queryAlerts().then(alerts=>{
        const recentAlerts = document.querySelector('#recentAlerts'); 
        recentAlerts.innerHTML = '';

        const recentAlertsTitle = document.createElement('h2');
        recentAlertsTitle.className = 'customWidgetTitle';
        recentAlertsTitle.textContent = "Recent Alerts";
        recentAlerts.append(recentAlertsTitle);

        alerts.items.forEach(alert => {
            recentAlerts.append(createAlertItem(alert));
        });
    })
}

window.getRecentAlertsData = getRecentAlertsData;