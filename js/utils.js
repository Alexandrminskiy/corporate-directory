// js/utils.js - УЛУЧШЕННАЯ ВЕРСИЯ

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
        
        // Добавляем timestamp чтобы избежать кэширования
        const url = apiUrl + '?callback=' + callbackName + '&_=' + Date.now();
        console.log('Загрузка с URL:', url);
        
        script.src = url;
        
        // Таймаут на случай проблем с сетью
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
            console.log('Получены данные:', data);
            cleanup();
            
            if (data && data.error) {
                reject(new Error(data.message || 'Ошибка сервера'));
            } else {
                resolve(data);
            }
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
        
        const url = apiUrl + '?callback=' + callbackName + 
                    '&data=' + encodeURIComponent(JSON.stringify(payload)) +
                    '&_=' + Date.now();
        
        console.log('Отправка на URL:', url);
        
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
            console.log('Получен ответ:', response);
            cleanup();
            
            if (response && response.error) {
                reject(new Error(response.message || 'Ошибка сервера'));
            } else {
                resolve(response || { success: true });
            }
        };
        
        script.onerror = function(error) {
            console.error('Ошибка отправки:', error);
            cleanup();
            reject(new Error('Не удалось отправить данные. Проверьте подключение к интернету.'));
        };
        
        document.body.appendChild(script);
    });
}