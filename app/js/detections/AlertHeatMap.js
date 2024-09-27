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

function getSeverityClass(severity){
    if(severity > 10) return "critical";
    if(severity >= 8) return "high";
    if(severity >= 4) return "medium";
    if(severity >= 1) return "low";
    else return "info";
}

function getTechniqueDiv(techniqueId, techniqueName, severity){
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
    // Technique severity
    div.classList.add(getSeverityClass(severity));
    div.append(id, name);
    return div;
}

export function getAlertHeatMapData() {
    getDetectionsResult().then((detections) => {
        if (!detections || !detections.items) {
            console.error('Run Detections response or id is undefined');
            return;
        }
        let tacticTechniqueCounter = {};
        let techniquesInfo = {};
        let tacticTechniqueSeverity = {};

        detections.items.forEach(detection => {
            if (detection.mitreAttacks && detection.mitreAttacks.length > 0) {
                detection.mitreAttacks.forEach((attack) => {
                    const tactic = attack.tactic;
                    if(!tacticTechniqueCounter[tactic.name]) tacticTechniqueCounter[tactic.name] = {};
                    if(!tacticTechniqueSeverity[tactic.name]) tacticTechniqueSeverity[tactic.name] = {};
                    tactic.techniques.forEach(technique => {
                        if(!techniquesInfo[technique.id]) techniquesInfo[technique.id] = technique;
                        if(!tacticTechniqueCounter[tactic.name][technique.id]) tacticTechniqueCounter[tactic.name][technique.id] = 1;
                        else tacticTechniqueCounter[tactic.name][technique.id]++;
                        if(!tacticTechniqueSeverity[tactic.name][technique.id]) tacticTechniqueSeverity[tactic.name][technique.id] = detection.severity;
                    })
                });
            }
        });
        console.log(tacticTechniqueCounter, techniquesInfo, tacticTechniqueSeverity);
        const alertHeatMapContainer = document.querySelector('#alertHeatMapWidget');
        alertHeatMapContainer.innerHTML = '';
        Object.entries(tacticTechniqueCounter).forEach(entry => {
            const techniquIds = Object.keys(entry[1]);
            const techniqueCounts = Object.values(entry[1]);
            let alertsCount = techniqueCounts.reduce((total, count) => total + count, 0);
            const attackDiv = getAttackDiv(entry[0], alertsCount);
            techniquIds.forEach(techniqueId => {
                attackDiv.append(getTechniqueDiv(techniqueId, techniquesInfo[techniqueId].name, tacticTechniqueSeverity[entry[0]][techniqueId])); 
            })
            alertHeatMapContainer.append(attackDiv);
        })
    })
}

window.getAlertHeatMapData = getAlertHeatMapData;