// js/utils.js - МАКСИМАЛЬНО ПРОСТАЯ ВЕРСИЯ

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Простейшая функция загрузки через JSONP
function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now();
        const script = document.createElement('script');
        
        // Формируем URL
        script.src = apiUrl + '?callback=' + callbackName;
        
        // Создаем callback функцию
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        
        // Обработка ошибок
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Не удалось загрузить данные'));
        };
        
        document.body.appendChild(script);
    });
}

// Простейшая функция отправки через JSONP
function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { action, data };
        if (recordId) payload.id = recordId;
        
        const callbackName = 'callback_' + Date.now();
        const script = document.createElement('script');
        
        // Формируем URL с данными
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
            reject(new Error('Не удалось отправить данные'));
        };
        
        document.body.appendChild(script);
    });
}