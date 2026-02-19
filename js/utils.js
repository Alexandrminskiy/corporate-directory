// js/utils.js

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Функция для загрузки контактов через прокси
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
        console.log('Загружено контактов:', Array.isArray(data) ? data.length : 0);
        
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        
        // Показываем понятное сообщение об ошибке
        let errorMessage = 'Ошибка загрузки данных: ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Проверьте подключение к интернету';
        } else if (error.message.includes('500')) {
            errorMessage += 'Внутренняя ошибка сервера';
        } else {
            errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
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
        
        if (result.error) {
            throw new Error(result.message || 'Неизвестная ошибка сервера');
        }
        
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        
        // Показываем понятное сообщение об ошибке
        let errorMessage = 'Ошибка отправки данных: ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Проверьте подключение к интернету';
        } else if (error.message.includes('500')) {
            errorMessage += 'Внутренняя ошибка сервера';
        } else {
            errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}