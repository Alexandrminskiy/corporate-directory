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
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Загружено контактов:', data.length);
        console.log('Пример контакта:', data[0]);
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
        // Используем JSONP подход для обхода CORS
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
        
        // Даем время на обработку
        await new Promise(resolve => setTimeout(resolve, 1000));
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}