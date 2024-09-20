$(document).ready(function() {
    showThreatActorsTable([]);
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

export function getThreatActorsTableData() {
    var eventsData = [];
    getEvents().then(events => {
        if (!events || !events.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        events.items.forEach(event => {
            if (event.amsi_threat_data) {
                var existingEventData = eventsData.find(eventData => eventData.actor === event.amsi_threat_data.processPath);
                if (existingEventData) {
                    existingEventData.frequency += 1;
                } else {
                    var eventData = {
                        actor: event.amsi_threat_data.processPath,
                        frequency: 1
                    };
                    eventsData.push(eventData);
                }
            }
        });
        showThreatActorsTable(eventsData);
    });
}

window.getThreatActorsTableData = getThreatActorsTableData;

function showThreatActorsTable(threatActors) {
    var table = '<table><thead><tr><th>Actor</th><th>Frequency</th></tr></thead><tbody>';
    
    threatActors.forEach(threatActor => {
        table += `<tr>
            <td>${threatActor.actor}</td>
            <td>${threatActor.frequency}</td>
        </tr>`;
    });

    table += '</tbody></table>';

    document.getElementById('threatActorsWidgetTableData').innerHTML = table;
}