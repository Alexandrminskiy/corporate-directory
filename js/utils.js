// js/utils.js

// --- Генерация ID пользователя ---
function generateUserId() {
    let userId = localStorage.getItem('contactBookUserId');
    if (!userId) {
        const userAgent = navigator.userAgent;
        const timestamp = Date.now().toString();
        userId = btoa(userAgent + timestamp).substring(0, 16);
        localStorage.setItem('contactBookUserId', userId);
    }
    return userId;
}

// --- Получение данных из Google Apps Script ---
async function fetchContacts(apiUrl) {
    try {
        console.log("Запрашиваем данные с:", apiUrl); // Лог для отладки
        const response = await fetch(apiUrl, {
            method: 'GET',
            // УБРАЛИ mode: 'no-cors' для получения ответа
            headers: {
                'Accept': 'application/json',
            }
        });

        console.log("Ответ от сервера (doGet):", response.status, response.statusText); // Лог статуса

        if (!response.ok) {
            // Получаем текст ошибки, если сервер вернул не 2xx
            const errorText = await response.text();
            console.error(`Ошибка HTTP при получении данных: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log("Полученные данные:", data); // Лог полученных данных
        return data;
    } catch (error) {
        console.error('Ошибка при выполнении fetch (doGet):', error);
        // Перебрасываем ошибку дальше, чтобы main.js мог её обработать
        throw error;
    }
}

// --- Отправка данных в Google Apps Script ---
// js/utils.js
async function sendContact(apiUrl, action, data, recordId = null) {
    const payload = { action, data };
    if (recordId) payload.id = recordId;

    try {
        console.log(`Отправляем ${action} запрос на:`, apiUrl, "Payload:", payload);

        const response = await fetch(apiUrl, {
            method: 'POST',
            mode: 'no-cors', // 🔑 Ключевое: без preflight
            headers: {
                'Content-Type': 'text/plain', // 🔑 Избегаем CORS preflight
            },
            body: JSON.stringify(payload),
        });

        console.log("Запрос отправлен (статус:", response.status, ")");

        // При no-cors ответ прочитать нельзя, поэтому ждём и считаем успешным
        await new Promise(resolve => setTimeout(resolve, 1500));

        return { result: "success_pending_reload" };

    } catch (error) {
        console.error('Ошибка отправки:', error);
        throw error;
    }
}
