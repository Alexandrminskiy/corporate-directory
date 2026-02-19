// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Функция для загрузки контактов через JSONP с увеличенным таймаутом
async function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        console.log('Загрузка контактов с:', apiUrl);
        
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        // Добавляем параметр callback в URL
        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName;
        
        console.log('Полный URL для JSONP:', fullUrl);
        
        // Увеличиваем таймаут до 30 секунд
        const timeout = setTimeout(() => {
            console.error('Таймаут загрузки контактов');
            cleanup();
            reject(new Error('Timeout loading contacts - сервер не отвечает'));
        }, 30000);
        
        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
        
        window[callbackName] = function(data) {
            console.log('JSONP ответ получен:', data);
            cleanup();
            
            // Проверяем, не пришла ли ошибка
            if (data && data.error) {
                reject(new Error(data.error));
            } else if (data && Array.isArray(data)) {
                resolve(data);
            } else {
                // Если данные не в ожидаемом формате, пробуем преобразовать
                console.warn('Неожиданный формат данных:', data);
                resolve(data || []);
            }
        };
        
        script.onerror = function(error) {
            console.error('Ошибка загрузки скрипта:', error);
            cleanup();
            reject(new Error('JSONP request failed - проверьте URL и доступ к серверу'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}

// Функция для отправки данных через JSONP
function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { 
            action, 
            data
        };
        
        if (recordId) {
            payload.id = recordId;
        }

        console.log('Отправка данных через JSONP:', payload);
        
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        // Формируем URL с параметрами
        const separator = apiUrl.includes('?') ? '&' : '?';
        const params = new URLSearchParams({
            callback: callbackName,
            data: JSON.stringify(payload)
        });
        
        const fullUrl = apiUrl + separator + params.toString();
        console.log('Полный URL для отправки:', fullUrl);
        
        // Увеличиваем таймаут до 30 секунд
        const timeout = setTimeout(() => {
            console.error('Таймаут отправки данных');
            cleanup();
            reject(new Error('Timeout sending data - сервер не отвечает'));
        }, 30000);
        
        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                document.body.removeChild(script);
            }
        }
        
        window[callbackName] = function(response) {
            console.log('JSONP ответ получен:', response);
            cleanup();
            
            if (response && response.error) {
                reject(new Error(response.error));
            } else if (response && response.success) {
                resolve(response);
            } else {
                // Если нет явного успеха, но нет и ошибки
                resolve(response || { success: true });
            }
        };
        
        script.onerror = function(error) {
            console.error('Ошибка загрузки скрипта:', error);
            cleanup();
            reject(new Error('JSONP request failed - проверьте URL и доступ к серверу'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}
// Альтернативный метод загрузки через iframe если JSONP не работает
async function fetchContactsViaIframe(apiUrl) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        
        const timeout = setTimeout(() => {
            document.body.removeChild(iframe);
            reject(new Error('Iframe timeout'));
        }, 10000);
        
        window.addEventListener('message', function onMessage(event) {
            if (event.data && Array.isArray(event.data)) {
                clearTimeout(timeout);
                window.removeEventListener('message', onMessage);
                document.body.removeChild(iframe);
                resolve(event.data);
            }
        });
        
        iframe.src = apiUrl + '?mode=iframe';
        document.body.appendChild(iframe);
    });
}