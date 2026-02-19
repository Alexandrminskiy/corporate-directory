// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // 🔴 ВАЖНО: Вставьте сюда вашу актуальную ссылку на Google Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbzpEJaFlyyaZnSBOZz6_pkA6ktaWRSAHlXqQXXbUwg7jlF_NmAcRaGn1PFj2U8KeFIC1A/exec';
    
    const userId = generateUserId();
    console.log('User ID:', userId);

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

    let allContacts = [];
    let currentEditingId = null;

    // --- Утилиты интерфейса ---
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status status--${type} status--visible`;
        setTimeout(() => statusMessage.classList.remove('status--visible'), 3000);
    }

    function clearForm() {
        [fioInput, roleInput, orgInput, locationInput, phoneInput, emailInput].forEach(i => i.value = '');
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
            
            // Проверка прав доступа
            const isOwner = contact['Добавлено пользователем'] === userId;
            console.log(`Контакт ${contact['ФИО']}: владелец? ${isOwner} (${contact['Добавлено пользователем']} vs ${userId})`);
            
            // Формирование строки "Должность, Организация"
            const roleOrg = [contact['Должность'], contact['Организация']]
                .filter(v => v && String(v).trim())
                .join(', ') || 'Не указано';
            
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
                            <button class="contact-card__edit-btn" data-id="${contact['ID']}">✏️ Редактировать</button>
                            <button class="contact-card__delete-btn" data-id="${contact['ID']}">🗑️ Удалить</button>
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
                        console.log('Нажата кнопка редактирования для ID:', contact['ID']);
                        openEditForm(contact);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Нажата кнопка удаления для ID:', contact['ID']);
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
            const fio = c['ФИО'] ? String(c['ФИО']).toLowerCase() : '';
            const role = c['Должность'] ? String(c['Должность']).toLowerCase() : '';
            const phone = c['Телефон'] != null ? String(c['Телефон']).toLowerCase() : '';
            const location = c['Населенный пункт'] ? String(c['Населенный пункт']).toLowerCase() : '';
            const org = c['Организация'] ? String(c['Организация']).toLowerCase() : '';
            
            return fio.includes(query) || 
                   role.includes(query) || 
                   phone.includes(query) || 
                   location.includes(query) ||
                   org.includes(query);
        });
        
        renderContacts(filtered);
    });

    // --- Модальное окно: Открыть для добавления ---
    showAddFormBtn.addEventListener('click', () => {
        currentEditingId = null;
        modalTitle.textContent = '➕ Добавить контакт';
        clearForm();
        modal.classList.add('modal-overlay--active');
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
        console.log('РЕДАКТИРОВАНИЕ: открытие формы для контакта:', contact);
        console.log('ID контакта:', contact['ID']);
        
        currentEditingId = contact['ID'];
        modalTitle.textContent = '✏️ Редактировать контакт';
        
        fioInput.value = contact['ФИО'] || '';
        roleInput.value = contact['Должность'] || '';
        orgInput.value = contact['Организация'] || '';
        locationInput.value = contact['Населенный пункт'] || '';
        phoneInput.value = contact['Телефон'] || '';
        emailInput.value = contact['Email'] || '';
        
        console.log('Заполнена форма:', {
            fio: fioInput.value,
            role: roleInput.value,
            location: locationInput.value,
            editingId: currentEditingId
        });
        
        modal.classList.add('modal-overlay--active');
    }

    // --- Сохранение (Добавление или Обновление) ---
saveFormBtn.addEventListener('click', async () => {
    console.log('Сохранение формы. Режим:', currentEditingId ? 'редактирование' : 'добавление');
    
    // Валидация
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

    // Блокируем кнопку на время отправки
    saveFormBtn.disabled = true;
    const originalText = saveFormBtn.textContent;
    saveFormBtn.textContent = 'Отправка...';

    try {
        const action = currentEditingId ? 'update' : 'add';
        showStatus(action === 'update' ? '💾 Обновление...' : '📤 Добавление...', 'info');
        
        await sendContact(API_URL, action, data, currentEditingId);
        
        // Закрываем модальное окно
        closeModalBtn.click();
        
        // Показываем успех
        showStatus(
            action === 'update' ? '✅ Контакт обновлён!' : '✅ Контакт добавлен!', 
            'success'
        );
        
        // Перезагружаем список
        setTimeout(() => {
            loadAndRender();
        }, 2000);
        
    } catch (err) {
        console.error('Ошибка сохранения:', err);
        showStatus('❌ Ошибка при сохранении: ' + err.message, 'error');
    } finally {
        // Разблокируем кнопку
        saveFormBtn.disabled = false;
        saveFormBtn.textContent = originalText;
    }
});

   // --- Загрузка данных с обработкой ошибок ---
async function loadAndRender() {
    try {
        console.log('Загрузка данных...');
        
        // Показываем индикатор загрузки
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
        
        // Показываем понятное сообщение об ошибке
        let errorMessage = '❌ Ошибка загрузки. ';
        
        if (err.message.includes('Timeout')) {
            errorMessage += 'Сервер не отвечает. Попробуйте обновить страницу или проверить подключение к интернету.';
        } else if (err.message.includes('JSONP')) {
            errorMessage += 'Проблема с доступом к серверу. Проверьте URL веб-приложения.';
        } else {
            errorMessage += err.message;
        }
        
        contactsGrid.innerHTML = `<div class="contact-card"><p>${errorMessage}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">🔄 Обновить страницу</button>
        </div>`;
    }
}

    // --- Обработка клавиши Escape для закрытия модального окна ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('modal-overlay--active')) {
            closeModalBtn.click();
        }
    });

    // --- Старт приложения ---
    loadAndRender();


    // Обработка сообщений от iframe
window.addEventListener('message', function(event) {
    console.log('Получено сообщение от iframe:', event.data);
    if (event.data && event.data.success !== undefined) {
        if (event.data.success) {
            showStatus('✅ Операция выполнена успешно', 'success');
        } else {
            showStatus('❌ ' + (event.data.error || 'Ошибка операции'), 'error');
        }
        // Перезагружаем данные
        setTimeout(() => {
            loadAndRender();
        }, 1500);
    }
});
});