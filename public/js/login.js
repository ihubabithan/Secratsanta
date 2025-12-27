document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showError('Please provide email and password');
            return;
        }

        try {
            const data = await apiCall('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data.success) {
                // Store token if needed (optional, since using cookies)
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (error) {
            showError(error.message || 'Login failed. Please check your credentials.');
        }
    });
});

// API helper functions
const API_BASE_URL = '';

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

function showError(message, elementId = 'error-message') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}
