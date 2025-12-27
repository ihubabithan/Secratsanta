document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        // Validate username length
        if (username.length < 3) {
            showError('Username must be at least 3 characters long');
            return;
        }

        try {
            const data = await apiCall('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
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
            showError(error.message || 'Registration failed. Please try again.');
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
