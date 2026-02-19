// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Функция для загрузки контактов через прокси
async function fetchContacts(apiUrl) {
    try {
        console.log('Загрузка контактов через прокси:', apiUrl);
        
        // Используем fetch с mode: 'cors'
        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Загружено контактов:', Array.isArray(data) ? data.length : 0);
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        
        // Пробуем альтернативный метод через JSONP
        console.log('Пробуем JSONP метод...');
        return fetchContactsJsonp(apiUrl);
    }
}

// Запасной вариант через JSONP
function fetchContactsJsonp(apiUrl) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName;
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Таймаут JSONP загрузки'));
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
            console.log('JSONP ответ получен:', data);
            resolve(data);
        };
        
        script.onerror = function() {
            cleanup();
            reject(new Error('Ошибка JSONP загрузки'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}

// Функция для отправки данных через прокси
async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { 
        action, 
        data
    };
    
    if (recordId) {
        payload.id = recordId;
    }

    console.log('Отправка данных через прокси:', payload);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Ответ сервера:', result);
        
        if (result.error) {
            throw new Error(result.message || 'Неизвестная ошибка сервера');
        }
        
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        
        // Пробуем отправить через JSONP
        console.log('Пробуем JSONP отправку...');
        return sendContactJsonp(apiUrl, action, data, recordId);
    }
}

// Отправка через JSONP
function sendContactJsonp(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { 
            action, 
            data
        };
        
        if (recordId) {
            payload.id = recordId;
        }
        
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        const separator = apiUrl.includes('?') ? '&' : '?';
        const params = new URLSearchParams({
            callback: callbackName,
            data: JSON.stringify(payload)
        });
        
        const fullUrl = apiUrl + separator + params.toString();
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Таймаут JSONP отправки'));
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
            console.log('JSONP ответ:', response);
            resolve(response || { success: true });
        };
        
        script.onerror = function() {
            cleanup();
            reject(new Error('Ошибка JSONP отправки'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}