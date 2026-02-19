// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Публичные CORS прокси (по очереди)
const PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://crossorigin.me/',
    'https://cors.io/?'
];

let currentProxyIndex = 0;

// Функция для загрузки контактов через прокси
async function fetchContacts(apiUrl) {
    // Пробуем разные прокси по очереди
    for (let i = 0; i < PROXIES.length; i++) {
        const proxyIndex = (currentProxyIndex + i) % PROXIES.length;
        const proxy = PROXIES[proxyIndex];
        
        try {
            console.log(`Попытка загрузки через прокси ${proxyIndex + 1}:`, proxy);
            
            // Кодируем URL для прокси
            const encodedUrl = encodeURIComponent(apiUrl);
            const proxyUrl = proxy + encodedUrl;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Контакты загружены:', data);
            
            // Если успешно, запоминаем рабочий прокси
            currentProxyIndex = proxyIndex;
            return data;
            
        } catch (error) {
            console.warn(`Прокси ${proxyIndex + 1} не работает:`, error.message);
            // Продолжаем со следующим прокси
        }
    }
    
    // Если все прокси не сработали, пробуем JSONP как запасной вариант
    console.log('Прокси не работают, пробуем JSONP...');
    return fetchContactsJsonp(apiUrl);
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
            if (data && data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data || []);
            }
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

    console.log('Отправка данных:', payload);
    
    // Пробуем разные прокси для отправки
    for (let i = 0; i < PROXIES.length; i++) {
        const proxyIndex = (currentProxyIndex + i) % PROXIES.length;
        const proxy = PROXIES[proxyIndex];
        
        try {
            console.log(`Отправка через прокси ${proxyIndex + 1}:`, proxy);
            
            // Для POST запросов нужно использовать прокси по-другому
            let response;
            
            if (proxy.includes('allorigins')) {
                // allorigins.win поддерживает только GET, используем JSONP для POST
                return sendContactJsonp(apiUrl, action, data, recordId);
            } else {
                // Другие прокси могут поддерживать POST
                const proxyUrl = proxy + apiUrl;
                
                response = await fetch(proxyUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(payload)
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Ответ сервера:', result);
            
            currentProxyIndex = proxyIndex;
            return result;
            
        } catch (error) {
            console.warn(`Прокси ${proxyIndex + 1} не работает для POST:`, error.message);
        }
    }
    
    // Если все прокси не сработали, используем JSONP
    console.log('Прокси не работают для POST, пробуем JSONP...');
    return sendContactJsonp(apiUrl, action, data, recordId);
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
            if (response && response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response || { success: true });
            }
        };
        
        script.onerror = function() {
            cleanup();
            reject(new Error('Ошибка JSONP отправки'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}