// js/utils.js - ФИНАЛЬНАЯ ВЕРСИЯ

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        const callbackName = 'cb_' + Date.now();
        const script = document.createElement('script');
        
        script.src = apiUrl + '?callback=' + callbackName;
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Ошибка загрузки'));
        };
        
        document.body.appendChild(script);
    });
}

function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const callbackName = 'cb_' + Date.now();
        const script = document.createElement('script');
        
        const payload = { action, data };
        if (recordId) payload.id = recordId;
        
        script.src = apiUrl + '?callback=' + callbackName + 
                    '&data=' + encodeURIComponent(JSON.stringify(payload));
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Ошибка отправки'));
        };
        
        document.body.appendChild(script);
    });
}