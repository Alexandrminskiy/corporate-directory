// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // 🔴 ВСТАВЬТЕ СЮДА ВАШУ ССЫЛКУ НА GOOGLE APPS SCRIPT
  const API_URL = 'https://script.google.com/macros/s/AKfycbzpEJaFlyyaZnSBOZz6_pkA6ktaWRSAHlXqQXXbUwg7jlF_NmAcRaGn1PFj2U8KeFIC1A/exec';
  
  const userId = generateUserId();
  console.log('User ID:', userId);

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const showAddFormBtn = document.getElementById('showAddFormBtn');
  const modal = document.getElementById('formModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveFormBtn = document.getElementById('saveFormBtn');
  const contactsGrid = document.getElementById('contactsGrid');
  const statusMessage = document.getElementById('statusMessage');
  const modalTitle = document.getElementById('modalTitle');
  
  const fioInput = document.getElementById('fioInput');
  const roleInput = document.getElementById('roleInput');
  const orgInput = document.getElementById('orgInput');
  const locationInput = document.getElementById('locationInput');
  const phoneInput = document.getElementById('phoneInput');
  const emailInput = document.getElementById('emailInput');

  let allContacts = [];
  let currentEditingId = null;

  // --- Показ статуса ---
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status status--${type} status--visible`;
    setTimeout(() => statusMessage.classList.remove('status--visible'), 3000);
  }

  // --- Безопасное преобразование в строку ---
  function safeString(value) {
    return value != null ? String(value).toLowerCase() : '';
  }

  // --- Рендеринг карточек ---
  function renderContacts(contactsToRender) {
    contactsGrid.innerHTML = '';
    
    if (contactsToRender.length === 0) {
      contactsGrid.innerHTML = '<div class="contact-card"><p>Контактов не найдено 🔍</p></div>';
      return;
    }

    contactsToRender.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      
      const isOwner = contact['Добавлено пользователем'] === userId;
      
      const roleOrg = [contact['Должность'], contact['Организация']]
        .filter(v => v && String(v).trim())
        .join(', ') || 'Не указано';
      
      // 🔑 Защита от чисел: приводим к строке
      const phoneRaw = contact['Телефон'] != null ? String(contact['Телефон']).trim() : '';
      const emailRaw = contact['Email'] != null ? String(contact['Email']).trim() : '';
      
      const phoneLink = phoneRaw 
        ? `<a href="tel:${phoneRaw.replace(/\D/g,'')}" class="contact-card__link">📞 ${phoneRaw}</a>` 
        : 'Не указан';
      
      const emailLink = emailRaw 
        ? `<a href="mailto:${emailRaw}" class="contact-card__link">✉️ ${emailRaw}</a>` 
        : 'Не указан';

      card.innerHTML = `
        <div class="contact-card__wrapper">
          <h4 class="contact-card__name">${contact['ФИО'] || 'Не указано'}</h4>
          <p class="contact-card__info contact-card__info--role-org">${roleOrg}</p>
          <p class="contact-card__info"><strong>📍</strong> ${contact['Населенный пункт'] || 'Не указан'}</p>
          <p class="contact-card__info"><strong>Телефон:</strong> ${phoneLink}</p>
          <p class="contact-card__info"><strong>Email:</strong> ${emailLink}</p>
          <div class="contact-card__actions">
            ${isOwner ? `
              <button class="contact-card__edit-btn" data-id="${contact['ID']}">✏️</button>
              <button class="contact-card__delete-btn" data-id="${contact['ID']}">🗑️</button>
            ` : ''}
          </div>
        </div>
      `;

      if (isOwner) {
        card.querySelector('.contact-card__edit-btn')?.addEventListener('click', () => openEditForm(contact));
        card.querySelector('.contact-card__delete-btn')?.addEventListener('click', () => handleDelete(contact['ID']));
      }
      
      contactsGrid.appendChild(card);
    });
  }

  // --- Поиск (с защитой от чисел) ---
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allContacts.filter(c => 
      safeString(c['ФИО']).includes(query) ||
      safeString(c['Должность']).includes(query) ||
      safeString(c['Организация']).includes(query) ||
      safeString(c['Населенный пункт']).includes(query) ||
      safeString(c['Телефон']).includes(query) || // 🔑 Теперь безопасно
      safeString(c['Email']).includes(query)
    );
    renderContacts(filtered);
  });

  // --- Модальное окно: открыть для добавления ---
  showAddFormBtn.addEventListener('click', () => {
    currentEditingId = null;
    modalTitle.textContent = '➕ Добавить контакт';
    [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput].forEach(i => i.value = '');
    modal.classList.add('modal-overlay--active');
  });

  // --- Модальное окно: закрыть ---
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('modal-overlay--active');
    currentEditingId = null;
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalBtn.click();
  });

  // --- Открыть форму для редактирования ---
  function openEditForm(contact) {
    currentEditingId = contact['ID'];
    modalTitle.textContent = '✏️ Редактировать контакт';
    fioInput.value = contact['ФИО'] || '';
    roleInput.value = contact['Должность'] || '';
    orgInput.value = contact['Организация'] || '';
    locationInput.value = contact['Населенный пункт'] || '';
    phoneInput.value = contact['Телефон'] || '';
    emailInput.value = contact['Email'] || '';
    modal.classList.add('modal-overlay--active');
  }

  // --- Сохранение (add/update) ---
  saveFormBtn.addEventListener('click', async () => {
    const data = {
      fio: fioInput.value.trim(),
      role: roleInput.value.trim(),
      org: orgInput.value.trim(),
      location: locationInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      userId
    };

    if (!data.fio || !data.role || !data.location) {
      showStatus('⚠️ Заполните: ФИО, Должность, Нас. пункт', 'error');
      return;
    }

    try {
      showStatus(currentEditingId ? '💾 Сохранение...' : '📤 Добавление...', 'info');
      
      const action = currentEditingId ? 'update' : 'add';
      // 🔑 Теперь result всегда определён (см. utils.js)
      await sendContact(API_URL, action, data, currentEditingId);
      
      closeModalBtn.click();
      await loadAndRender();
      showStatus(currentEditingId ? '✅ Обновлено!' : '✅ Добавлено!', 'success');
    } catch (err) {
      console.error(err);
      showStatus('❌ Ошибка сети', 'error');
    }
  });

  // --- Удаление ---
  async function handleDelete(recordId) {
    if (!confirm('Удалить эту запись?')) return;
    
    try {
      showStatus('🗑️ Удаление...', 'info');
      await sendContact(API_URL, 'delete', {}, recordId);
      await loadAndRender();
      showStatus('✅ Удалено!', 'success');
    } catch (err) {
      console.error(err);
      showStatus('❌ Ошибка при удалении', 'error');
    }
  }

  // --- Загрузка данных ---
  async function loadAndRender() {
    try {
      allContacts = await fetchContacts(API_URL);
      renderContacts(allContacts);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      contactsGrid.innerHTML = '<div class="contact-card">❌ Ошибка загрузки. Проверьте API_URL.</div>';
    }
  }

  // --- Старт ---
  loadAndRender();
});