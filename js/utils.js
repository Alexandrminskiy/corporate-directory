// js/utils.js

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
        
        script.src = apiUrl + '?callback=' + callbackName + '&_=' + Date.now();
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Таймаут загрузки данных'));
        }, 10000);
        
        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
        
        window[callbackName] = function(data) {
            cleanup();
            console.log('fetchContacts получил данные:', data);
            resolve(data);
        };
        
        script.onerror = function(error) {
            console.error('Ошибка загрузки скрипта:', error);
            cleanup();
            reject(new Error('Не удалось загрузить данные. Проверьте подключение к интернету.'));
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
                    '&data=' + encodeURIComponent(JSON.stringify(payload)) +
                    '&_=' + Date.now();
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Таймаут отправки данных'));
        }, 10000);
        
        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
        
        window[callbackName] = function(response) {
            cleanup();
            console.log('sendContact получил ответ:', response);
            resolve(response || { success: true });
        };
        
        script.onerror = function(error) {
            console.error('Ошибка отправки:', error);
            cleanup();
            reject(new Error('Не удалось отправить данные. Проверьте подключение к интернету.'));
        };
        
        document.body.appendChild(script);
    });
}