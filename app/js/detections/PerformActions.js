// Populate actions and endpoint selectors
function populateDropdown(dropdown, items) {
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.text = item.name;
        dropdown.appendChild(option);
    });
}

// Add event listener to execute button
function addEventListenerToExecuteButton(){
    document.getElementById('execute-btn').addEventListener('click', () => {
        const selectedAction = actionSelect.value;
        const selectedEndpoint = endpointSelect.value;
        console.log(`Executing ${selectedAction} on ${selectedEndpoint}`);
    });
}

// Create widget
document.addEventListener('DOMContentLoaded', function () {
    const performActionsWidget = document.querySelector('#performActionsWidget');

});

// Make api request
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

// Get widget data
export function getPerformActionsWidgetData(){
    let endpoints = [];
    const actions = [
        {
            id: 'Delete Endpoint',
            name: 'Delete Endpoint'
        }, 
        {
            id: 'Scan Endpoint',
            name: 'Scan Endpoint'
        },
        {
            id: 'Isolate Endpoint',
            name: 'Isolate Endpoint'
        },
        {
            id: 'List Endpoint',
            name: 'List Endpoint'
        },
        {
            id: 'Get User',
            name: 'Get User'
        }
    ];
    const actionSelect = document.getElementById('action-select');
    const endpointSelect = document.getElementById('endpoint-select');
    
    queryEndpoints().then(response => {
        response.items.forEach(item => {
            endpoints.push({id: item.id, name: item.hostname});
        })
        populateDropdown(actionSelect, actions);
        populateDropdown(endpointSelect, endpoints);
        addEventListenerToExecuteButton();
    })
    
}

// Add to window object
window.getPerformActionsWidgetData = getPerformActionsWidgetData;