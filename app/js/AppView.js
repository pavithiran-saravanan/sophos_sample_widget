window.refreshAccessToken = function refreshAccessToken() {
    const data = {
        grant_type: 'refresh_token',
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: refreshToken
    };
    fetch('https://id.sophos.com/api/v2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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

export function setEnvironment() {
    return fetch('../app/config/config.json')
        .then(response => response.json())
        .then(config => {
            window.grantType = 'client_credentials';
            window.scope = 'token';
            window.clientID = config.clientID;
            window.clientSecret = config.clientSecret;
            window.dataRegion = config.dataRegion;
            window.tenantID = config.tenantID;
        })
        .catch(error => {
            console.error('Error setting environment variables');
        })
}


export function authenticate() {
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

export function whoAmI() {
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