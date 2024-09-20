$(document).ready(function() {
    showInfectedEndpointsTable([]);
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

export function getRecentInfectedEndpointsTableData () {
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

window.getRecentInfectedEndpointsTableData = getRecentInfectedEndpointsTableData;

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