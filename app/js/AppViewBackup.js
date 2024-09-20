$(document).ready(function() {
    setEnvironment();
    showInfectedEndpointsTable([]);
    authenticate().then(response => {
        getTopAlertsChartData();
        getEndpointsByHealthChartData();
        getRecentInfectedEndpointsTableData();
    });
});

function setEnvironment() {
    window.grantType = 'client_credentials';
    window.scope = 'token';
    window.clientID = '8dbffcaf-9012-4bd4-96d7-e9cc21562234';
    window.clientSecret = '29aaf3549822766aed9cb91c9eff86e058a49ab8ba156b237e74db28b2797f994c9cec931d2e735e497dea36c43d3bf3dd1c';
    window.dataRegion = 'in01';
    window.tenantID = '309964df-b76b-43e0-a0a5-4935b5ad42d6';
};

function authenticate() {
    const data = {
        grant_type: grantType,
        scope: 'token',
        client_id: clientID,
        client_secret: clientSecret
    };
    return fetch('https://id.sophos.com/api/v2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data),
    }).then (response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    }).then(data => {
        console.log('Success:', data);
        window.accessToken = data.access_token;
        window.refreshToken = data.refresh_token;
    }).catch((error) => {
        console.error('Error:', error);
    });
};

function refreshAccessToken() {
    const data = {
        grant_type: 'refresh_token',
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: refreshToken
    };
    fetch('https://id.sophos.com/api/v2/oauth2/token', {
        method: 'POST',
        body: JSON.stringify(data)
    }).then (response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    }).then(data => {
        console.log('Success:', data);
        window.accessToken = data.access_token;
        window.refreshToken = data.refresh_token;
    }).catch((error) => {
        console.error('Error:', error);
    });
};

function whoAmI() {
    fetch('https://api.central.sophos.com/whoami/v1', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    }).then(data => {
        console.log('Success:', data);
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

function getEndpointsByHealthChartData() {
    queryEndpoints().then(endpointDetails => {
        if (!endpointDetails || !endpointDetails.items) {
            console.error('Endpoint details or items are undefined');
            return;
        }
        var endpointsHealthData = {
            good: 0,
            suspicious: 0,
            bad: 0
        };
        endpointDetails.items.forEach(element => {
            if (element.health.overall == 'good') {
                endpointsHealthData.good = endpointsHealthData.good + 1;
            } else if (element.health.overall == 'bad') {
                endpointsHealthData.bad = endpointsHealthData.bad + 1;
            } else {
                endpointsHealthData.suspicious = endpointsHealthData.suspicious + 1;
            }
        });
        endpointHealthDataWidgetChart.series[0].setData([endpointsHealthData.suspicious, endpointsHealthData.bad, endpointsHealthData.good]);
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

function getRecentInfectedEndpointsTableData () {
    getDetectionsResult().then(detections => {
        if (!detections || !detections.items) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        
        var recentInfectedEndpoints = [];
        
        detections.items.forEach(detection => {
            var existingEndpoint = recentInfectedEndpoints.find(endpoint => endpoint.endpointID === detection.device.id);
            
            if (existingEndpoint) {
                existingEndpoint.detectionCount += 1;
            } else {
                var recentInfectedEndpoint = {
                    endpoint: detection.device.entity,
                    endpointID: detection.device.id,
                    detectionCount: 1, 
                    os: detection.rawData.meta_os_platform,
                    location: detection.geolocation[0].country
                };
                recentInfectedEndpoints.push(recentInfectedEndpoint);
            }
        });
        showInfectedEndpointsTable(recentInfectedEndpoints);
    });
}

function showInfectedEndpointsTable(recentInfectedEndpoints) {
    var table = '<table><thead><tr><th>Endpoint</th><th>Detection</th><th>OS</th><th>Location</th></tr></thead><tbody>';
    
    recentInfectedEndpoints.forEach(endpoint => {
        table += `<tr>
            <td>${endpoint.endpoint}</td>
            <td>${endpoint.detectionCount}</td>
            <td>${endpoint.os}</td>
            <td>${endpoint.location}</td>
        </tr>`;
    });

    table += '</tbody></table>';

    document.getElementById('infectedEndpointsWidgetTableData').innerHTML = table;
}

function getAlerts() {
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

function getTopAlertsChartData() {
    var alertsData = [];
    getAlerts().then(alerts => {
        if (!alerts || !alerts.items) {
            console.error('Alerts details or items are undefined');
            return;
        }
        alerts.items.forEach(alert => {
            var existingAlertData = alertsData.find(alertData => alertData.name === alert.type);
            if (existingAlertData) {
                existingAlertData.y += 1;
            } else {
                var alertData = {
                    name: alert.type,
                    y: 0
                };
                alertsData.push(alertData);
            }
        });
        topAlertsWidgetChart.series[0].setData(alertsData);
    });
}
