// js/utils.js

function generateUserId() {
  let userId = localStorage.getItem('contactBookUserId');
  if (!userId) {
    userId = btoa(navigator.userAgent + Date.now()).substring(0, 16);
    localStorage.setItem('contactBookUserId', userId);
  }
  return userId;
}

async function fetchContacts(apiUrl) {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

async function sendContact(apiUrl, action, data, recordId = null) {
  const payload = { action, data };
  if (recordId) payload.id = recordId;

  try {
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors', // Обязательно для Google Apps Script
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    // При no-cors ответ прочитать нельзя, ждём и считаем успешным
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { result: 'success' }; 
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
    throw error;
  }
}