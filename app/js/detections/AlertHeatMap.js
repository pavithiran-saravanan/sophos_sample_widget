let alertHeatMap;

document.addEventListener('DOMContentLoaded', function () {
    
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

function getAttackDiv(attackName, attackCount){
    const div = document.createElement('div');
    div.classList.add('attackContainer');
    // Id div
    const id = document.createElement('div');
    id.classList.add('attackName');
    id.textContent = attackName;  
    // Count div
    const count = document.createElement('div');
    count.classList.add('attackCount');
    count.textContent = attackCount + " Alerts";
    div.append(id, count);
    return div;
}

function getTechniqueDiv(techniqueId, techniqueName){
    const div = document.createElement('div');
    div.classList.add('techniqueContainer');
    // Technique Id
    const id = document.createElement('div');
    id.classList.add('techniqueId');
    id.textContent = techniqueId;
    // Technique Name
    const name = document.createElement('div');
    name.classList.add('techniqueName');
    name.textContent = techniqueName;
    div.append(id, name);
    return div;
}

export function getAlertHeatMapData() {
    getDetectionsResult().then((detections) => {
        if (!detections || !detections.items) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        
        let tacticNameToIdMap = {};
        let tacticAlertsCounter = {};
        
        detections.items.forEach(detection => {
            if (detection.mitreAttacks && detection.mitreAttacks.length > 0) {
                detection.mitreAttacks.forEach(attack => {
                    if(!tacticAlertsCounter[attack.tactic.name]){
                        tacticAlertsCounter[attack.tactic.name] = 0;
                    }
                    if(!tacticNameToIdMap[attack.tactic.name]){
                        tacticNameToIdMap[attack.tactic.name] = [];
                    }
                    tacticAlertsCounter[attack.tactic.name]++;
                    attack.tactic.techniques.forEach(technique => {
                        tacticNameToIdMap[attack.tactic.name].push(technique);
                    })
                });
            }
        });

        console.log(tacticNameToIdMap, tacticAlertsCounter);
        const alertHeatMapContainer = document.querySelector('#alertHeatMapWidget');
        Object.entries(tacticNameToIdMap).forEach(tactic => {
            let alertsCount = tactic[1].length;
            const attackDiv = getAttackDiv(tactic[0], alertsCount);
            tactic[1].forEach(technique=>{
                attackDiv.append(getTechniqueDiv(technique.id, technique.name))
            })
            alertHeatMapContainer.append(attackDiv);
        })
    })
}

window.getAlertHeatMapData = getAlertHeatMapData;