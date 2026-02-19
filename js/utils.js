// js/utils.js - УПРОЩЕННАЯ ВЕРСИЯ

function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// Простая функция загрузки
async function fetchContacts(apiUrl) {
    try {
        console.log('Загрузка контактов с:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
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
        throw new Error('Не удалось загрузить данные. Проверьте подключение к интернету.');
    }
}

// Простая функция отправки
async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { action, data };
    if (recordId) payload.id = recordId;

    console.log('Отправка данных:', payload);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Ответ:', result);
        return result;
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw new Error('Не удалось отправить данные. Проверьте подключение к интернету.');
    }
}