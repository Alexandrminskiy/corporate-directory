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
        
        // Добавляем параметр для избежания кэширования
        const url = apiUrl + '?t=' + Date.now();
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('Загружено контактов:', data.length);
        
        // Проверяем, не пришла ли ошибка
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
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
        // Используем FormData для отправки
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Ответ сервера:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Неизвестная ошибка сервера');
        }
        
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}