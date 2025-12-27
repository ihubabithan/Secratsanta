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
        
        if (data.count === 0) {
            showError('No participants available at the moment.');
            return;
        }
        
        // Add auto-assign button listener
        document.getElementById('auto-assign-btn').addEventListener('click', autoAssignParticipant);
        
        participantsSection.style.display = 'block';
    } catch (error) {
        showError('Failed to load available participants');
        console.error(error);
    }
}

async function autoAssignParticipant() {
    try {
        const btn = document.getElementById('auto-assign-btn');
        btn.disabled = true;
        btn.textContent = '🎲 Assigning...';
        
        console.log('Calling auto-assign API...');
        const data = await apiCall('/api/selections/auto-assign', {
            method: 'POST'
        });
        
        console.log('API response:', data);
        
        if (data.success && data.data.assignedPerson) {
            // Show modal with assigned person info
            showAssignmentModal(data.data.assignedPerson);
        }
    } catch (error) {
        console.error('Auto-assign error:', error);
        showError(error.message || 'Failed to auto-assign participant');
        const btn = document.getElementById('auto-assign-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🎲 Auto-Assign My Secret Santa';
        }
    }
}

function showAssignmentModal(assignedPerson) {
    const modal = document.getElementById('assignment-modal');
    document.getElementById('assigned-name').textContent = assignedPerson.username;
    document.getElementById('assigned-email').textContent = assignedPerson.email;
    
    modal.style.display = 'flex';
    
    // Close modal on button click
    document.getElementById('modal-close-btn').onclick = () => {
        modal.style.display = 'none';
        window.location.reload();
    };
    
    // Close modal on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            window.location.reload();
        }
    };
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
