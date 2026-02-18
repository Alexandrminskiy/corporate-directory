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

// --- Получение данных (GET) ---
async function fetchContacts(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    throw error;
  }
}

// --- Отправка данных (POST) ---
async function sendContact(apiUrl, action, data, recordId = null) {
  const payload = { action, data };
  if (recordId) payload.id = recordId;

  try {
    console.log(`Отправка ${action}...`, payload);
    
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors', // 🔑 Обязательно для Google Scripts
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // При no-cors ответ прочитать нельзя, поэтому просто ждём
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Запрос отправлен');
    return { result: 'success' }; // Возвращаем успешный статус вручную
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
    throw error;
  }
}