// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- ВАЖНО: Вставьте сюда НОВУЮ ссылку из шага 1 (Google Apps Script) ---
    const API_URL = 'https://script.google.com/macros/s/AKfycbzpEJaFlyyaZnSBOZz6_pkA6ktaWRSAHlXqQXXbUwg7jlF_NmAcRaGn1PFj2U8KeFIC1A/exec'; // ЗАМЕНИТЬ!

    const userId = generateUserId(); // Получаем ID пользователя
    console.log('User ID:', userId); // Для отладки

    // --- DOM Elements ---
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

    let allContacts = []; // Хранит все контакты из таблицы
    let currentEditingId = null; // ID записи, которую редактируем (null если добавляем новую)

    // --- Функция показа статуса ---
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status status--${type} status--visible`;
        setTimeout(() => {
            statusMessage.classList.remove('status--visible');
        }, 3000);
    }

    // --- Рендеринг карточек ---
    // --- Рендеринг карточек ---
function renderContacts(contactsToRender) {
    contactsGrid.innerHTML = '';
    if (contactsToRender.length === 0) {
        contactsGrid.innerHTML = '<div class="contact-card"><p>Контактов не найдено.</p></div>';
        return;
    }

    contactsToRender.forEach(contact => {
        const cardElement = document.createElement('div');
        cardElement.className = 'contact-card';

        // Определяем, может ли пользователь управлять этой записью
        const isOwner = contact['Добавлено пользователем'] === userId;

        // Формируем строку для должности/организации
        let roleOrgLine = [];
        if (contact['Должность']) roleOrgLine.push(`<strong>${contact['Должность']}</strong>`);
        if (contact['Организация']) roleOrgLine.push(contact['Организация']);
        const roleOrgString = roleOrgLine.join(', ');

        // --- БЕЗОПАСНОЕ ПОЛУЧЕНИЕ И ОБРАБОТКИ ТЕЛЕФОНА И EMAIL ---
        // Приведение к строке и проверка на пустоту
        const phoneValue = contact['Телефон'] != null ? String(contact['Телефон']).trim() : '';
        const emailValue = contact['Email'] != null ? String(contact['Email']).trim() : '';

        // --- БЕЗОПАСНОЕ СОЗДАНИЕ ССЫЛОК ---
        const phoneDisplay = phoneValue ? `<a href="tel:${phoneValue.replace(/\D/g,'')}" class="contact-card__link">${phoneValue}</a>` : 'Не указан';
        const emailDisplay = emailValue ? `<a href="mailto:${emailValue}" class="contact-card__link">${emailValue}</a>` : 'Не указан';

        cardElement.innerHTML = `
            <div class="contact-card__wrapper">
                <h4 class="contact-card__name">${contact['ФИО'] || 'Не указано'}</h4>
                <p class="contact-card__info contact-card__info--role-org">${roleOrgString || 'Не указана'}</p>
                <p class="contact-card__info"><strong>Посёлок:</strong> ${contact['Населенный пункт'] || 'Не указан'}</p>
                <p class="contact-card__info contact-card__info--phone">
                    <strong>Телефон:</strong> ${phoneDisplay}
                </p>
                <p class="contact-card__info contact-card__info--email">
                    <strong>Email:</strong> ${emailDisplay}
                </p>
                <div class="contact-card__actions">
                    ${isOwner ? `
                        <button class="contact-card__edit-btn" data-id="${contact['ID']}">✏️ Редактировать</button>
                        <button class="contact-card__delete-btn" data-id="${contact['ID']}">🗑 Удалить</button>
                    ` : ''}
                </div>
            </div>
        `;

        if (isOwner) {
            const editBtn = cardElement.querySelector('.contact-card__edit-btn');
            const deleteBtn = cardElement.querySelector('.contact-card__delete-btn');

            editBtn.addEventListener('click', (e) => openEditForm(contact));
            deleteBtn.addEventListener('click', (e) => handleDelete(contact['ID']));
        }

        contactsGrid.appendChild(cardElement);
    });
}

    // --- Открытие формы для редактирования ---
    function openEditForm(contact) {
        currentEditingId = contact['ID'];
        modalTitle.textContent = 'Редактировать контакт';
        fioInput.value = contact['ФИО'] || '';
        roleInput.value = contact['Должность'] || '';
        orgInput.value = contact['Организация'] || '';
        locationInput.value = contact['Населенный пункт'] || '';
        phoneInput.value = contact['Телефон'] || '';
        emailInput.value = contact['Email'] || '';
        modal.classList.add('modal-overlay--active');
    }

    // --- Обработчик поиска ---
    searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allContacts.filter(contact => {
        // Приводим к строке и проверяем на наличие значения перед вызовом .includes()
        const fio = contact['ФИО'] ? contact['ФИО'].toLowerCase() : '';
        const role = contact['Должность'] ? contact['Должность'].toLowerCase() : '';
        // Приводим телефон к строке
        const phone = contact['Телефон'] != null ? String(contact['Телефон']) : '';
        const location = contact['Населенный пункт'] ? contact['Населенный пункт'].toLowerCase() : '';

        return (
            fio.includes(query) ||
            role.includes(query) ||
            phone.includes(query) || // Теперь phone - это строка
            location.includes(query)
        );
    });
    renderContacts(filtered);
});

    // --- Логика формы (модальное окно) ---
    showAddFormBtn.addEventListener('click', () => {
        currentEditingId = null; // Сбрасываем ID редактирования
        modalTitle.textContent = 'Добавить новый контакт';
        // Очищаем форму
        fioInput.value = '';
        roleInput.value = '';
        orgInput.value = '';
        locationInput.value = '';
        phoneInput.value = '';
        emailInput.value = '';
        modal.classList.add('modal-overlay--active');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('modal-overlay--active');
        currentEditingId = null; // Сбрасываем ID при закрытии
    });

    // Закрытие модального окна при клике вне его области
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalBtn.click();
        }
    });

    // --- Обработчик сохранения (добавление или изменение) ---
    saveFormBtn.addEventListener('click', async () => {
        const fio = fioInput.value.trim();
        const role = roleInput.value.trim();
        const org = orgInput.value.trim();
        const location = locationInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();

        if (!fio || !role || !location) {
            showStatus('Заполните обязательные поля: ФИО, Должность, Посёлок.', 'error');
            return;
        }

        try {
            showStatus(currentEditingId ? 'Сохраняем изменения...' : 'Добавляем...', 'info');

            let result;
            if (currentEditingId) {
                // Обновление
                result = await sendContact(API_URL, 'update', {
                    fio, role, org, location, phone, email, userId
                }, currentEditingId);
            } else {
                // Добавление
                result = await sendContact(API_URL, 'add', {
                    fio, role, org, location, phone, email, userId
                });
            }

            if (result.result === 'added' || result.result === 'updated') {
                // Закрываем модальное окно
                closeModalBtn.click();
                // Перезагружаем список
                await loadAndRender();
                showStatus(currentEditingId ? 'Контакт успешно обновлён!' : 'Контакт успешно добавлен!', 'success');
            } else if (result.result === 'not_found') {
                showStatus('Запись не найдена или ошибка при сохранении.', 'error');
            } else {
                showStatus('Неизвестная ошибка при сохранении.', 'error');
            }
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            showStatus('Ошибка сети при сохранении.', 'error');
        }
    });

    // --- Обработчик удаления ---
    async function handleDelete(recordId) {
        if (!confirm('Вы уверены, что хотите удалить этот контакт? Это действие нельзя отменить.')) {
            return;
        }

        try {
            showStatus('Удаляем...', 'info');
            const result = await sendContact(API_URL, 'delete', {}, recordId);

            if (result.result === 'deleted') {
                await loadAndRender(); // Перезагружаем список
                showStatus('Контакт успешно удален!', 'success');
            } else if (result.result === 'not_found') {
                showStatus('Запись не найдена или ошибка при удалении.', 'error');
            } else {
                showStatus('Неизвестная ошибка при удалении.', 'error');
            }
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            showStatus('Ошибка сети при удалении.', 'error');
        }
    }

    // --- Загрузка и отображение ---
    async function loadAndRender() {
        try {
            allContacts = await fetchContacts(API_URL);
            renderContacts(allContacts);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            contactsGrid.innerHTML = '<div class="contact-card"><p>Ошибка загрузки данных. Проверьте подключение и API URL.</p></div>';
        }
    }

    // --- Запуск при загрузке ---
    loadAndRender();
});