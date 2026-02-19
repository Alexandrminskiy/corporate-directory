// js/utils.js - ВЕРСИЯ С ОТЛАДКОЙ

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Загрузка контактов через JSONP с отладкой
async function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        console.log('1. Начинаем загрузку контактов с:', apiUrl);

        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        console.log('2. Имя callback функции:', callbackName);

        const script = document.createElement('script');

        // Добавляем параметр callback
        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName;
        console.log('3. Полный URL запроса:', fullUrl);

        const timeout = setTimeout(() => {
            console.error('4. ТАЙМАУТ! Сервер не отвечает');
            cleanup();
            reject(new Error('Таймаут загрузки данных'));
        }, 15000);

        function cleanup() {
            console.log('5. Очистка ресурсов');
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }

        // Создаем callback функцию
        window[callbackName] = function (data) {
            console.log('6. ПОЛУЧЕН ОТВЕТ от сервера:', data);
            cleanup();

            // Проверяем на ошибки
            if (data && data.error) {
                console.error('7. Ошибка в ответе:', data.message);
                reject(new Error(data.message || 'Ошибка сервера'));
            } else {
                console.log('7. Данные успешно получены');
                resolve(data);
            }
        };

        script.onload = function () {
            console.log('8. Скрипт загружен');
        };

        script.onerror = function (error) {
            console.error('8. ОШИБКА загрузки скрипта:', error);
            cleanup();
            reject(new Error('Ошибка загрузки скрипта - проверьте доступность сервера'));
        };

        script.src = fullUrl;
        document.body.appendChild(script);
        console.log('4. Скрипт добавлен в DOM');
    });
}

// Отправка данных через JSONP с отладкой
async function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { action, data };
        if (recordId) payload.id = recordId;

        console.log('1. Отправка данных:', payload);

        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');

        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName + '&data=' + encodeURIComponent(JSON.stringify(payload));
        console.log('2. URL отправки:', fullUrl);

        const timeout = setTimeout(() => {
            console.error('3. ТАЙМАУТ отправки');
            cleanup();
            reject(new Error('Таймаут отправки данных'));
        }, 15000);

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }

        window[callbackName] = function (response) {
            console.log('4. ПОЛУЧЕН ОТВЕТ:', response);
            cleanup();

            if (response && response.error) {
                reject(new Error(response.message || 'Ошибка сервера'));
            } else {
                resolve(response || { success: true });
            }
        };

        script.onerror = function (error) {
            console.error('5. ОШИБКА отправки:', error);
            cleanup();
            reject(new Error('Ошибка отправки данных'));
        };

        script.src = fullUrl;
        document.body.appendChild(script);
    });
}