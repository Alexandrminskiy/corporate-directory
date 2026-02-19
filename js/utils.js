// js/utils.js - МАКСИМАЛЬНО ПРОСТАЯ ВЕРСИЯ

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Функция для загрузки контактов
function fetchContacts(apiUrl) {
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now();
        const script = document.createElement('script');
        
        // Формируем URL с callback
        script.src = apiUrl + '?callback=' + callbackName;
        
        // Создаем callback функцию
        window[callbackName] = function(data) {
            // Очищаем
            delete window[callbackName];
            document.body.removeChild(script);
            
            // Проверяем на ошибки
            if (data && data.error) {
                reject(new Error(data.message || 'Ошибка сервера'));
            } else {
                resolve(data);
            }
        };
        
        // Обработка ошибок
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Не удалось загрузить данные. Проверьте подключение к интернету.'));
        };
        
        // Добавляем скрипт на страницу
        document.body.appendChild(script);
    });
}

// Функция для отправки данных
function sendContact(apiUrl, action, data, recordId = null) {
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now();
        const script = document.createElement('script');
        
        // Подготавливаем данные
        const payload = { action, data };
        if (recordId) payload.id = recordId;
        
        // Формируем URL с callback и данными
        script.src = apiUrl + '?callback=' + callbackName + 
                    '&data=' + encodeURIComponent(JSON.stringify(payload));
        
        // Создаем callback функцию
        window[callbackName] = function(response) {
            // Очищаем
            delete window[callbackName];
            document.body.removeChild(script);
            
            // Проверяем на ошибки
            if (response && response.error) {
                reject(new Error(response.message || 'Ошибка сервера'));
            } else {
                resolve(response || { success: true });
            }
        };
        
        // Обработка ошибок
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Не удалось отправить данные. Проверьте подключение к интернету.'));
        };
        
        // Добавляем скрипт на страницу
        document.body.appendChild(script);
    });
}