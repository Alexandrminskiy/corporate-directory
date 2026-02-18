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
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Загружено контактов:', data.length);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
}

async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { 
        action, 
        data,
        id: recordId 
    };
    
    if (recordId) payload.id = recordId;

    console.log('Отправка данных:', payload);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        // При no-cors ответ прочитать нельзя, ждём и считаем успешным
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { result: 'success' };
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}