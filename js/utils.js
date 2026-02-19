// js/utils.js - РАБОЧАЯ ВЕРСИЯ С JSONP

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Загрузка контактов через JSONP
async function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        console.log('Загрузка контактов через JSONP:', apiUrl);

        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');

        // Добавляем параметр callback
        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName;

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

        window[callbackName] = function (data) {
            cleanup();
            console.log('Данные получены:', data);

            // Проверяем на ошибки
            if (data && data.error) {
                reject(new Error(data.message || 'Ошибка сервера'));
            } else {
                resolve(data);
            }
        };

        script.onerror = function () {
            cleanup();
            reject(new Error('Ошибка загрузки скрипта'));
        };

        script.src = fullUrl;
        document.body.appendChild(script);
    });
}

// Отправка данных через JSONP
async function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { action, data };
        if (recordId) payload.id = recordId;

        console.log('Отправка данных через JSONP:', payload);

        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');

        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName + '&data=' + encodeURIComponent(JSON.stringify(payload));

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

        window[callbackName] = function (response) {
            cleanup();
            console.log('Ответ получен:', response);

            if (response && response.error) {
                reject(new Error(response.message || 'Ошибка сервера'));
            } else {
                resolve(response || { success: true });
            }
        };

        script.onerror = function () {
            cleanup();
            reject(new Error('Ошибка отправки данных'));
        };

        script.src = fullUrl;
        document.body.appendChild(script);
    });
}