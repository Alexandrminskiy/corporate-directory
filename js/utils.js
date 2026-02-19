// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Функция для загрузки контактов через JSONP
async function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        console.log('Загрузка контактов с:', apiUrl);
        
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        // Добавляем параметр callback в URL
        const separator = apiUrl.includes('?') ? '&' : '?';
        const fullUrl = apiUrl + separator + 'callback=' + callbackName;
        
        // Таймаут на случай ошибки
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout loading contacts'));
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
            console.log('Контакты загружены:', data);
            
            // Проверяем, не пришла ли ошибка
            if (data && data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data || []);
            }
        };
        
        script.onerror = function() {
            cleanup();
            reject(new Error('JSONP request failed'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}

// Функция для отправки данных через скрытую форму
function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const payload = { 
            action, 
            data
        };
        
        if (recordId) {
            payload.id = recordId;
        }

        console.log('Отправка данных:', payload);

        // Создаем уникальные имена для iframe и формы
        const formId = 'form_' + Math.random().toString(36).substr(2, 9);
        const iframeId = 'iframe_' + Math.random().toString(36).substr(2, 9);
        
        // Создаем iframe
        const iframe = document.createElement('iframe');
        iframe.name = iframeId;
        iframe.id = iframeId;
        iframe.style.display = 'none';
        
        // Создаем форму
        const form = document.createElement('form');
        form.id = formId;
        form.method = 'POST';
        form.action = apiUrl;
        form.target = iframeId;
        form.style.display = 'none';
        form.enctype = 'multipart/form-data';
        
        // Добавляем данные как скрытое поле
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(payload);
        form.appendChild(input);
        
        // Таймаут
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout sending data'));
        }, 15000);
        
        function cleanup() {
            clearTimeout(timeout);
            if (document.getElementById(formId)) {
                document.body.removeChild(form);
            }
            if (document.getElementById(iframeId)) {
                document.body.removeChild(iframe);
            }
            window.removeEventListener('message', messageHandler);
        }
        
        // Обработчик сообщения от iframe
        function messageHandler(event) {
            // Проверяем origin (можно сделать более строгую проверку)
            if (event.data && typeof event.data === 'object') {
                console.log('Получен ответ:', event.data);
                cleanup();
                
                if (event.data.success) {
                    resolve(event.data);
                } else {
                    reject(new Error(event.data.error || 'Unknown error'));
                }
            }
        }
        
        window.addEventListener('message', messageHandler);
        
        // Обработчик загрузки iframe (запасной вариант)
        iframe.onload = function() {
            console.log('Iframe загружен');
            // Не резолвим здесь, ждем message
        };
        
        iframe.onerror = function() {
            cleanup();
            reject(new Error('Iframe loading failed'));
        };
        
        // Добавляем на страницу
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        // Отправляем форму
        console.log('Отправка формы...');
        form.submit();
    });
}