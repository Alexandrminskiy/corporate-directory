// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Простая функция загрузки через прокси
async function fetchContacts(apiUrl) {
    try {
        console.log('Загрузка контактов через прокси:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Загружено контактов:', data.length);
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
}

// Простая функция отправки через прокси
async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { 
        action, 
        data
    };
    
    if (recordId) {
        payload.id = recordId;
    }

    console.log('Отправка данных через прокси:', payload);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Ответ сервера:', result);
        
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}