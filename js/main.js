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
                        e.stopPropagation();
                        openEditForm(contact);
                    });
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
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
            userId
        };

        try {
            showStatus(currentEditingId ? '💾 Сохранение...' : '📤 Добавление...', 'info');
            
            await sendContact(API_URL, currentEditingId ? 'update' : 'add', data, currentEditingId);
            
            closeModalBtn.click();
            await loadAndRender();
            
            showStatus(
                currentEditingId ? '✅ Контакт обновлён!' : '✅ Контакт добавлен!', 
                'success'
            );
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            showStatus('❌ Ошибка при сохранении', 'error');
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
            showStatus('❌ Ошибка при удалении', 'error');
        }
    }

    // --- Загрузка данных ---
    async function loadAndRender() {
        try {
            const data = await fetchContacts(API_URL);
            if (Array.isArray(data)) {
                allContacts = data;
                renderContacts(allContacts);
                console.log('Загружено контактов:', allContacts.length);
            } else {
                console.error('Неверный формат данных:', data);
                contactsGrid.innerHTML = '<div class="contact-card">❌ Ошибка формата данных</div>';
            }
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            contactsGrid.innerHTML = '<div class="contact-card">❌ Ошибка загрузки. Проверьте API_URL и доступ к таблице.</div>';
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
});