// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // 🔴 ВАЖНО: Вставьте сюда URL вашего ПРОКСИ скрипта
  const API_URL = 'https://script.google.com/macros/s/AKfycbzjQe4YUPQb9zT8hsMWUtzxxns9VacVWWTqVxlTc2AC2iBx58mURvnVS2EWUbXMQA7hUg/exec';

  // --- СНАЧАЛА объявляем ВСЕ переменные ---
  const userId = generateUserId();
  console.log('User ID:', userId);

  // --- Переменные состояния (объявляем ДО всего) ---
  let allContacts = [];  // Это должно быть ДО использования
  let currentEditingId = null;

  // --- DOM Элементы ---
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

  // --- Утилиты интерфейса ---
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status status--${type} status--visible`;

    setTimeout(() => {
      statusMessage.classList.remove('status--visible');
    }, 3000);
  }

  function clearForm() {
    [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput].forEach(i => i.value = '');
  }

  // --- Рендеринг карточек ---
  function renderContacts(contactsToRender) {
    contactsGrid.innerHTML = '';

    if (contactsToRender.length === 0) {
      contactsGrid.innerHTML = '<div class="contact-card"><p>🔍 Контактов не найдено</p></div>';
      return;
    }

    contactsToRender.forEach(contact => {
      const card = document.createElement('div');
      card.className = 'contact-card';

      // Проверка прав доступа
      const isOwner = contact['Добавлено пользователем'] === userId;

      // Форматируем ФИО
      const fullName = contact['ФИО'] && contact['ФИО'].trim() ? contact['ФИО'] : 'Имя не указано';

      // Форматируем должность
      const role = contact['Должность'] && contact['Должность'].trim() ? contact['Должность'] : 'Должность не указана';

      // Форматируем организацию
      const org = contact['Организация'] && contact['Организация'].trim() ? contact['Организация'] : '';

      // Форматируем должность + организация
      const roleOrg = org ? `${role}, ${org}` : role;

      // Форматируем телефон
      let phoneRaw = contact['Телефон'] != null ? String(contact['Телефон']).trim() : '';
      let phoneLink = '📞 Не указан';

      if (phoneRaw) {
        const phoneDigits = phoneRaw.replace(/\D/g, '');
        if (phoneDigits) {
          phoneLink = `<a href="tel:${phoneDigits}" class="contact-card__link">📞 ${phoneRaw}</a>`;
        } else {
          phoneLink = `📞 ${phoneRaw}`;
        }
      }

      // Форматируем email
      const emailRaw = contact['Email'] != null ? String(contact['Email']).trim() : '';
      const emailLink = emailRaw
        ? `<a href="mailto:${emailRaw}" class="contact-card__link">✉️ ${emailRaw}</a>`
        : '✉️ Не указан';

      // Форматируем населенный пункт
      const location = contact['Населенный пункт'] && contact['Населенный пункт'].trim()
        ? contact['Населенный пункт']
        : 'Не указан';

      card.innerHTML = `
                <div class="contact-card__wrapper">
                    <h4 class="contact-card__name">${fullName}</h4>
                    <p class="contact-card__info contact-card__info--role-org">
                        <strong>💼</strong> ${roleOrg}
                    </p>
                    <p class="contact-card__info">
                        <strong>📍</strong> ${location}
                    </p>
                    <p class="contact-card__info">${phoneLink}</p>
                    <p class="contact-card__info">${emailLink}</p>
                    <div class="contact-card__actions">
                        ${isOwner ? `
                            <button class="contact-card__edit-btn" data-id="${contact['ID']}">
                                ✏️ Редактировать
                            </button>
                            <button class="contact-card__delete-btn" data-id="${contact['ID']}">
                                🗑️ Удалить
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

      // Навешиваем обработчики событий
      if (isOwner) {
        const editBtn = card.querySelector('.contact-card__edit-btn');
        const deleteBtn = card.querySelector('.contact-card__delete-btn');

        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditForm(contact);
          });
        }

        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete(contact['ID']);
          });
        }
      }

      contactsGrid.appendChild(card);
    });
  }

  // --- Поиск ---
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
      renderContacts(allContacts);
      return;
    }

    const filtered = allContacts.filter(c => {
      const fields = [
        c['ФИО'],
        c['Должность'],
        c['Организация'],
        c['Населенный пункт'],
        c['Телефон'],
        c['Email']
      ].map(f => (f ? String(f).toLowerCase() : ''));

      return fields.some(field => field.includes(query));
    });

    renderContacts(filtered);
  });

  // --- Модальное окно: Открыть для добавления ---
  showAddFormBtn.addEventListener('click', () => {
    currentEditingId = null;
    modalTitle.textContent = '➕ Добавить новый контакт';
    clearForm();
    modal.classList.add('modal-overlay--active');

    setTimeout(() => fioInput.focus(), 100);
  });

  // --- Модальное окно: Закрыть ---
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('modal-overlay--active');
    currentEditingId = null;
    clearForm();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModalBtn.click();
    }
  });

  // --- Модальное окно: Открыть для редактирования ---
  function openEditForm(contact) {
    console.log('Редактирование контакта:', contact);

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

  // --- Сохранение (Добавление или Обновление) ---
  saveFormBtn.addEventListener('click', async () => {
    if (!fioInput.value.trim()) {
      showStatus('⚠️ Укажите ФИО', 'error');
      fioInput.focus();
      return;
    }

    if (!roleInput.value.trim()) {
      showStatus('⚠️ Укажите должность', 'error');
      roleInput.focus();
      return;
    }

    if (!locationInput.value.trim()) {
      showStatus('⚠️ Укажите населённый пункт', 'error');
      locationInput.focus();
      return;
    }

    const data = {
      fio: fioInput.value.trim(),
      role: roleInput.value.trim(),
      org: orgInput.value.trim(),
      location: locationInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      userId: userId
    };

    saveFormBtn.disabled = true;
    const originalText = saveFormBtn.textContent;
    saveFormBtn.textContent = '⏳ Сохранение...';

    try {
      const action = currentEditingId ? 'update' : 'add';
      showStatus(action === 'update' ? '💾 Обновление...' : '📤 Добавление...', 'info');

      await sendContact(API_URL, action, data, currentEditingId);

      closeModalBtn.click();

      showStatus(
        action === 'update' ? '✅ Контакт обновлён!' : '✅ Контакт добавлен!',
        'success'
      );

      await loadAndRender();

    } catch (err) {
      console.error('Ошибка сохранения:', err);
      showStatus('❌ ' + err.message, 'error');
    } finally {
      saveFormBtn.disabled = false;
      saveFormBtn.textContent = originalText;
    }
  });

  // --- Удаление ---
  async function handleDelete(recordId) {
    if (!confirm('Вы уверены, что хотите удалить этот контакт?')) return;

    try {
      showStatus('🗑️ Удаление...', 'info');

      await sendContact(API_URL, 'delete', {}, recordId);

      await loadAndRender();

      showStatus('✅ Контакт удалён!', 'success');

    } catch (err) {
      console.error('Ошибка удаления:', err);
      showStatus('❌ ' + err.message, 'error');
    }
  }

  // --- Загрузка данных ---
  async function loadAndRender() {
    try {
      console.log('Загрузка данных...');

      contactsGrid.innerHTML = '<div class="contact-card"><p>⏳ Загрузка контактов...</p></div>';

      const data = await fetchContacts(API_URL);
      console.log('Данные получены:', data);

      if (Array.isArray(data)) {
        allContacts = data;
        console.log('Всего контактов загружено:', allContacts.length);

        if (allContacts.length === 0) {
          contactsGrid.innerHTML = '<div class="contact-card"><p>📭 Нет контактов. Нажмите "Добавить" для создания первого контакта.</p></div>';
        } else {
          renderContacts(allContacts);
        }
      } else {
        console.error('Неверный формат данных:', data);
        contactsGrid.innerHTML = '<div class="contact-card"><p>❌ Ошибка формата данных. Проверьте структуру таблицы.</p></div>';
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);

      contactsGrid.innerHTML = `
                <div class="contact-card">
                    <p>❌ ${err.message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 10px;
                        padding: 8px 16px;
                        background-color: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">🔄 Обновить страницу</button>
                </div>
            `;
    }
  }

  // --- Обработка клавиши Escape ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('modal-overlay--active')) {
      closeModalBtn.click();
    }
  });

  // --- Обработка Enter в форме ---
  const inputs = [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput];
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveFormBtn.click();
      }
    });
  });

  // --- Старт приложения ---
  loadAndRender();
});