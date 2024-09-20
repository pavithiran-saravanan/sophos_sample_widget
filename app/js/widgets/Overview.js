function getAlerts() {
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
        console.log('Success:', data);
        return data;
    }).catch(error => {
        console.error('Error:', error);
    });
}

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


function getThreatActors() {
    var eventsData = [];
    return getEvents().then(events => {
        if (!events || !events.items) {
            console.error('Events details or items are undefined');
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
        return eventsData;
    });
}

function getUsers() {
    return fetch(`https://api-${dataRegion}.central.sophos.com/common/v1/directory/users`, {
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

export function getOverviewData() {
    getAlerts().then(alerts => {
        if (!alerts || !alerts.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        document.getElementById('overviewWidgetAlertsCountValue').textContent = alerts.items.length;
    });

    getDetectionsResult().then(detections => {
        if (!detections || !detections.items) {
            console.error('Get Detections response or id is undefined');
            return;
        }
        document.getElementById('overviewWidgetInfectedEndpointsCountValue').textContent = detections.items.length;

    });
    
    getThreatActors().then(threatActors => {
        if (!threatActors) {
            console.error('Threat Actors response or id is undefined');
            return;
        }
        document.getElementById('overviewWidgetThreatActorsCountValue').textContent = threatActors.length;
    });

    getUsers().then(users => {
        if (!users || !users.items) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        document.getElementById('overviewWidgetUsersCountValue').textContent = users.items.length;
    });

    // document.getElementById('overviewWidgetAppConnectionsCountValue').textContent = detections.items.length;
    // document.getElementById('overviewWidgetWebConnectionsCountValue').textContent = detections.items.length;
}

window.getOverviewData = getOverviewData;