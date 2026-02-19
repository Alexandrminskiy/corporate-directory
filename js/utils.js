// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

async function fetchContacts(apiUrl) {
    try {
        console.log('Загрузка контактов с:', apiUrl);
        
        // Используем JSONP для получения данных
        const data = await jsonpRequest(apiUrl);
        console.log('Загружено контактов:', data.length);
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
}

// Функция для JSONP запросов
function jsonpRequest(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const script = document.createElement('script');
        
        // Добавляем параметр callback в URL
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = url + separator + 'callback=' + callbackName;
        
        window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('JSONP request failed'));
        };
        
        script.src = fullUrl;
        document.body.appendChild(script);
    });
}

// Функция для отправки данных через форму
function submitForm(apiUrl, data) {
    return new Promise((resolve, reject) => {
        // Создаем скрытую форму
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = apiUrl;
        form.target = 'iframe_' + Math.random().toString(36).substr(2, 9);
        form.style.display = 'none';
        
        // Создаем скрытый iframe для получения ответа
        const iframe = document.createElement('iframe');
        iframe.name = form.target;
        iframe.style.display = 'none';
        
        // Обработчик загрузки iframe
        iframe.onload = function() {
            setTimeout(() => {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve({ success: true });
            }, 1000);
        };
        
        iframe.onerror = function() {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            reject(new Error('Iframe load failed'));
        };
        
        // Добавляем данные в форму
        const dataField = document.createElement('input');
        dataField.type = 'hidden';
        dataField.name = 'data';
        dataField.value = JSON.stringify(data);
        form.appendChild(dataField);
        
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        // Отправляем форму
        form.submit();
    });
}

async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { 
        action, 
        data
    };
    
    if (recordId) {
        payload.id = recordId;
    }

    console.log('Отправка данных на сервер:', JSON.stringify(payload, null, 2));

    try {
        // Используем iframe для отправки вместо fetch (обходит CORS)
        await submitForm(apiUrl, payload);
        
        // Даем время на обработку
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return { success: true };
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}