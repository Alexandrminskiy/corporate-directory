// Простой вариант - разделяем GET и POST
async function fetchContacts(apiUrl) {
    try {
        // Для GET используем прокси
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(apiUrl);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        throw error;
    }
}

async function sendContact(apiUrl, action, data, recordId = null) {
    // Для POST используем iframe
    return new Promise((resolve, reject) => {
        const payload = { action, data };
        if (recordId) payload.id = recordId;
        
        const formId = 'form_' + Math.random().toString(36).substr(2, 9);
        const iframeId = 'iframe_' + Math.random().toString(36).substr(2, 9);
        
        const iframe = document.createElement('iframe');
        iframe.name = iframeId;
        iframe.id = iframeId;
        iframe.style.display = 'none';
        
        const form = document.createElement('form');
        form.id = formId;
        form.method = 'POST';
        form.action = apiUrl;
        form.target = iframeId;
        form.style.display = 'none';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(payload);
        form.appendChild(input);
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout'));
        }, 15000);
        
        function cleanup() {
            clearTimeout(timeout);
            if (document.getElementById(formId)) document.body.removeChild(form);
            if (document.getElementById(iframeId)) document.body.removeChild(iframe);
        }
        
        iframe.onload = function() {
            cleanup();
            resolve({ success: true });
        };
        
        iframe.onerror = function() {
            cleanup();
            reject(new Error('Iframe error'));
        };
        
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        form.submit();
    });
}