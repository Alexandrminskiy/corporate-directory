// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbzpEJaFlyyaZnSBOZz6_pkA6ktaWRSAHlXqQXXbUwg7jlF_NmAcRaGn1PFj2U8KeFIC1A/exec';
  const userId = generateUserId();

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

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status status--${type} status--visible`;
    setTimeout(() => statusMessage.classList.remove('status--visible'), 3000);
  }

  function renderContacts(contactsToRender) {
    contactsGrid.innerHTML = '';
    if (contactsToRender.length === 0) {
      contactsGrid.innerHTML = '<div class="contact-card"><p>Контактов не найдено</p></div>';
      return;
    }

    contactsToRender.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      const isOwner = contact['Добавлено пользователем'] === userId;
      
      const roleOrg = [contact['Должность'], contact['Организация']].filter(v => v).join(', ') || 'Не указано';
      const phoneRaw = contact['Телефон'] != null ? String(contact['Телефон']).trim() : '';
      const emailRaw = contact['Email'] != null ? String(contact['Email']).trim() : '';
      
      card.innerHTML = `
        <div class="contact-card__wrapper">
          <h4 class="contact-card__name">${contact['ФИО'] || 'Не указано'}</h4>
          <p class="contact-card__info">${roleOrg}</p>
          <p class="contact-card__info">📍 ${contact['Населенный пункт'] || ''}</p>
          <p class="contact-card__info">📞 ${phoneRaw ? `<a href="tel:${phoneRaw}">${phoneRaw}</a>` : ''}</p>
          <p class="contact-card__info">✉️ ${emailRaw ? `<a href="mailto:${emailRaw}">${emailRaw}</a>` : ''}</p>
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

  // В функции searchInput.addEventListener:
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allContacts.filter(contact => {
    const fio = contact['ФИО'] ? String(contact['ФИО']).toLowerCase() : '';
    const role = contact['Должность'] ? String(contact['Должность']).toLowerCase() : '';
    const phone = contact['Телефон'] != null ? String(contact['Телефон']) : '';
    const location = contact['Населенный пункт'] ? String(contact['Населенный пункт']).toLowerCase() : '';
    
    return (
      fio.includes(query) ||
      role.includes(query) ||
      phone.includes(query) ||
      location.includes(query)
    );
  });
  renderContacts(filtered);
});

  showAddFormBtn.addEventListener('click', () => {
    currentEditingId = null;
    modalTitle.textContent = '➕ Добавить контакт';
    [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput].forEach(i => i.value = '');
    modal.classList.add('modal-overlay--active');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('modal-overlay--active');
    currentEditingId = null;
  });

  function openEditForm(contact) {
    currentEditingId = contact['ID'];
    modalTitle.textContent = '✏️ Редактировать';
    fioInput.value = contact['ФИО'] || '';
    roleInput.value = contact['Должность'] || '';
    orgInput.value = contact['Организация'] || '';
    locationInput.value = contact['Населенный пункт'] || '';
    phoneInput.value = contact['Телефон'] || '';
    emailInput.value = contact['Email'] || '';
    modal.classList.add('modal-overlay--active');
  }

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

    if (!data.fio || !data.location) {
      showStatus('Заполните ФИО и Нас. пункт', 'error');
      return;
    }

    try {
      showStatus('Сохранение...', 'info');
      
      // 🔑 ИСПРАВЛЕНИЕ: сохраняем результат в переменную result
      const result = await sendContact(API_URL, currentEditingId ? 'update' : 'add', data, currentEditingId);
      
      closeModalBtn.click();
      await loadAndRender();
      showStatus(currentEditingId ? '✅ Обновлено!' : '✅ Добавлено!', 'success');
    } catch (err) {
      console.error(err);
      showStatus('❌ Ошибка сети', 'error');
    }
  });

  async function handleDelete(recordId) {
    if (!confirm('Удалить?')) return;
    try {
      showStatus('Удаление...', 'info');
      await sendContact(API_URL, 'delete', {}, recordId);
      await loadAndRender();
      showStatus('✅ Удалено!', 'success');
    } catch (err) {
      showStatus('❌ Ошибка', 'error');
    }
  }

  async function loadAndRender() {
    try {
      allContacts = await fetchContacts(API_URL);
      renderContacts(allContacts);
    } catch (err) {
      contactsGrid.innerHTML = '<div class="contact-card">❌ Ошибка загрузки</div>';
    }
  }

  loadAndRender();
});// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbzpEJaFlyyaZnSBOZz6_pkA6ktaWRSAHlXqQXXbUwg7jlF_NmAcRaGn1PFj2U8KeFIC1A/exec';
  const userId = generateUserId();

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

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status status--${type} status--visible`;
    setTimeout(() => statusMessage.classList.remove('status--visible'), 3000);
  }

  function safeString(value) {
    return value != null ? String(value).toLowerCase() : '';
  }

  function renderContacts(contactsToRender) {
    contactsGrid.innerHTML = '';
    if (contactsToRender.length === 0) {
      contactsGrid.innerHTML = '<div class="contact-card"><p>Контактов не найдено</p></div>';
      return;
    }

    contactsToRender.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';
      const isOwner = contact['Добавлено пользователем'] === userId;
      
      const roleOrg = [contact['Должность'], contact['Организация']].filter(v => v).join(', ') || 'Не указано';
      
      // 🔑 Защита от чисел
      const phoneRaw = contact['Телефон'] != null ? String(contact['Телефон']).trim() : '';
      const emailRaw = contact['Email'] != null ? String(contact['Email']).trim() : '';
      
      card.innerHTML = `
        <div class="contact-card__wrapper">
          <h4 class="contact-card__name">${contact['ФИО'] || 'Не указано'}</h4>
          <p class="contact-card__info">${roleOrg}</p>
          <p class="contact-card__info">📍 ${contact['Населенный пункт'] || ''}</p>
          <p class="contact-card__info">📞 ${phoneRaw ? `<a href="tel:${phoneRaw}">${phoneRaw}</a>` : ''}</p>
          <p class="contact-card__info">✉️ ${emailRaw ? `<a href="mailto:${emailRaw}">${emailRaw}</a>` : ''}</p>
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

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allContacts.filter(c => 
      safeString(c['ФИО']).includes(query) ||
      safeString(c['Должность']).includes(query) ||
      safeString(c['Телефон']).includes(query) ||
      safeString(c['Населенный пункт']).includes(query)
    );
    renderContacts(filtered);
  });

  showAddFormBtn.addEventListener('click', () => {
    currentEditingId = null;
    modalTitle.textContent = '➕ Добавить контакт';
    [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput].forEach(i => i.value = '');
    modal.classList.add('modal-overlay--active');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('modal-overlay--active');
    currentEditingId = null;
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalBtn.click();
  });

  function openEditForm(contact) {
    currentEditingId = contact['ID'];
    modalTitle.textContent = '✏️ Редактировать';
    fioInput.value = contact['ФИО'] || '';
    roleInput.value = contact['Должность'] || '';
    orgInput.value = contact['Организация'] || '';
    locationInput.value = contact['Населенный пункт'] || '';
    phoneInput.value = contact['Телефон'] || '';
    emailInput.value = contact['Email'] || '';
    modal.classList.add('modal-overlay--active');
  }

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

    if (!data.fio || !data.location) {
      showStatus('Заполните ФИО и Нас. пункт', 'error');
      return;
    }

    try {
      showStatus('Сохранение...', 'info');
      await sendContact(API_URL, currentEditingId ? 'update' : 'add', data, currentEditingId);
      closeModalBtn.click();
      await loadAndRender(); // 🔑 Перезагружаем данные чтобы увидеть изменения
      showStatus(currentEditingId ? '✅ Обновлено!' : '✅ Добавлено!', 'success');
    } catch (err) {
      console.error(err);
      showStatus('❌ Ошибка', 'error');
    }
  });

  async function handleDelete(recordId) {
    if (!confirm('Удалить?')) return;
    try {
      showStatus('Удаление...', 'info');
      await sendContact(API_URL, 'delete', {}, recordId);
      await loadAndRender();
      showStatus('✅ Удалено!', 'success');
    } catch (err) {
      showStatus('❌ Ошибка', 'error');
    }
  }

  async function loadAndRender() {
    try {
      allContacts = await fetchContacts(API_URL);
      renderContacts(allContacts);
    } catch (err) {
      contactsGrid.innerHTML = '<div class="contact-card">❌ Ошибка загрузки</div>';
    }
  }

  loadAndRender();
});