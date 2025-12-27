let currentUser = null;
let selectedParticipant = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    currentUser = await checkAuth();
    
    if (currentUser) {
        // Display user info
        document.getElementById('user-name').textContent = currentUser.username;
        document.getElementById('welcome-user').textContent = currentUser.username;
        
        // Check selection status and load appropriate content
        await checkSelectionStatus();
        
        // Setup logout button
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        // Setup message form
        setupMessageForm();
    }
});

async function checkSelectionStatus() {
    try {
        const data = await apiCall('/api/selections/my-selection');
        
        if (data.data) {
            // User has already made a selection - show message section
            selectedParticipant = data.data;
            document.getElementById('message-section').style.display = 'block';
        } else {
            // User hasn't selected anyone yet - show available participants
            await loadAvailableParticipants();
        }
    } catch (error) {
        showError('Failed to check selection status');
        console.error(error);
    }
}

async function loadAvailableParticipants() {
    try {
        const data = await apiCall('/api/selections/available');
        
        const participantsSection = document.getElementById('participants-section');
        const participantsList = document.getElementById('participants-list');
        
        if (data.count === 0) {
            participantsList.innerHTML = '<p class="no-data">No participants available at the moment.</p>';
        } else {
            participantsList.innerHTML = data.data.map(participant => `
                <div class="participant-card">
                    <h4>${participant.username}</h4>
                    <p class="email">${participant.email}</p>
                    <button class="btn btn-primary btn-small select-btn" data-username="${participant.username}">
                        Select
                    </button>
                </div>
            `).join('');
            
            // Add event listeners to select buttons
            document.querySelectorAll('.select-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const participantUsername = e.target.dataset.username;
                    selectParticipant(participantUsername);
                });
            });
        }
        
        participantsSection.style.display = 'block';
    } catch (error) {
        showError('Failed to load available participants');
        console.error(error);
    }
}

async function selectParticipant(receiverUsername) {
    try {
        const data = await apiCall('/api/selections', {
            method: 'POST',
            body: JSON.stringify({ receiverUsername })
        });
        
        if (data.success) {
            showSuccess('Participant selected successfully!');
            
            // Reload the page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        showError(error.message || 'Failed to select participant');
    }
}

function setupMessageForm() {
    const form = document.getElementById('message-form');
    const taskDescription = document.getElementById('task-description');
    const charCount = document.querySelector('.char-count');
    
    // Character counter
    taskDescription.addEventListener('input', () => {
        const length = taskDescription.value.length;
        charCount.textContent = `${length} / 500 characters`;
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskDescriptionValue = taskDescription.value.trim();
        const deadline = document.getElementById('deadline').value;
        
        if (!taskDescriptionValue) {
            showError('Please enter a task description');
            return;
        }
        
        try {
            const data = await apiCall('/api/messages', {
                method: 'POST',
                body: JSON.stringify({
                    taskDescription: taskDescriptionValue,
                    deadline: deadline || null
                })
            });
            
            if (data.success) {
                showSuccess('Task sent successfully!');
                form.reset();
                charCount.textContent = '0 / 500 characters';
                
                // Optionally redirect to tasks page
                setTimeout(() => {
                    window.location.href = '/tasks';
                }, 1500);
            }
        } catch (error) {
            showError(error.message || 'Failed to send task');
        }
    });
}

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

function showSuccess(message, elementId = 'success-message') {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function checkAuth() {
    try {
        const data = await apiCall('/api/auth/me');
        return data.user;
    } catch (error) {
        window.location.href = '/login';
        return null;
    }
}

async function logout() {
    try {
        await apiCall('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
    }
}
