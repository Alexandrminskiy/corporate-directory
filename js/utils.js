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

  // 🔑 Важно: no-cors обязателен для Google Apps Script
  await fetch(apiUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' }, // 🔑 text/plain избегает preflight
    body: JSON.stringify(payload),
  });

  // Ждём пока GAS обработает запрос
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { result: 'success' };
}