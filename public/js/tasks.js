let currentUser = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    currentUser = await checkAuth();
    
    if (currentUser) {
        // Display user info
        document.getElementById('user-name').textContent = currentUser.username;
        
        // Setup logout button
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        // Setup filter buttons
        setupFilters();
        
        // Load tasks
        await loadTasks('all');
    }
});

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load tasks based on filter
            const filter = e.target.dataset.filter;
            currentFilter = filter;
            await loadTasks(filter);
        });
    });
}

async function loadTasks(filter) {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '<p class="loading">Loading tasks...</p>';
    
    try {
        let endpoint;
        
        switch(filter) {
            case 'sent':
                endpoint = '/api/messages/sent';
                break;
            case 'received':
                endpoint = '/api/messages/received';
                break;
            default:
                endpoint = '/api/messages/public';
        }
        
        const data = await apiCall(endpoint);
        
        if (data.count === 0) {
            tasksList.innerHTML = '<p class="no-data">No tasks found.</p>';
        } else {
            tasksList.innerHTML = data.data.map(task => createTaskCard(task)).join('');
        }
    } catch (error) {
        showError('Failed to load tasks');
        tasksList.innerHTML = '<p class="error">Failed to load tasks. Please try again.</p>';
        console.error(error);
    }
}

function createTaskCard(task) {
    const senderName = 'Anonymous';
    const receiverName = task.receiverId ? task.receiverId.username : 'Unknown';
    const isMyTask = task.senderId && task.senderId === currentUser.id;
    const isAdmin = currentUser.email === 'abithan.p.ihub@snsgroups.com';
    const isCompleted = task.isCompleted || false;
    const isMarkedIncomplete = task.markedIncompleteAt;
    
    let statusBadge = '';
    if (isCompleted) {
        statusBadge = '<span class="status-badge completed">✓ Completed</span>';
    } else if (isMarkedIncomplete) {
        statusBadge = '<span class="status-badge incomplete">✗ Incomplete (-5)</span>';
    }
    
    let adminButtons = '';
    if (isAdmin && !isCompleted) {
        adminButtons = `
            <div class="admin-actions">
                <button class="btn-complete" onclick="markTaskComplete('${task._id}')">Mark as Completed</button>
                ${!isMarkedIncomplete ? `<button class="btn-incomplete" onclick="markTaskIncomplete('${task._id}')">Mark as Incomplete</button>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="task-card ${isMyTask ? 'my-task' : ''} ${isCompleted ? 'completed' : ''} ${isMarkedIncomplete ? 'incomplete' : ''}">
            <div class="task-header">
                <div class="task-participants">
                    <span class="sender">From: <strong>${senderName}</strong></span>
                    <span class="arrow">→</span>
                    <span class="receiver">To: <strong>${receiverName}</strong></span>
                </div>
                <div class="task-header-right">
                    ${statusBadge}
                    <span class="task-date">${formatDate(task.createdAt)}</span>
                </div>
            </div>
            
            <div class="task-body">
                <p class="task-description">${escapeHtml(task.taskDescription)}</p>
            </div>
            
            <div class="task-footer">
                <span class="deadline">
                    ${task.deadline ? `Deadline: ${formatDate(task.deadline)}` : 'No deadline'}
                </span>
            </div>
            ${adminButtons}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

async function markTaskComplete(taskId) {
    const password = prompt('Enter admin password to mark task as completed:');
    
    if (!password) {
        return;
    }
    
    try {
        const data = await apiCall(`/api/messages/${taskId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ password })
        });
        
        alert(data.message);
        await loadTasks(currentFilter);
    } catch (error) {
        alert('Failed to mark task as completed: ' + error.message);
    }
}

async function markTaskIncomplete(taskId) {
    const password = prompt('Enter admin password to mark task as incomplete (-5 points):');
    
    if (!password) {
        return;
    }
    
    if (!confirm('This will deduct 5 points from the user. Are you sure?')) {
        return;
    }
    
    try {
        const data = await apiCall(`/api/messages/${taskId}/incomplete`, {
            method: 'PUT',
            body: JSON.stringify({ password })
        });
        
        alert(data.message);
        await loadTasks(currentFilter);
    } catch (error) {
        alert('Failed to mark task as incomplete: ' + error.message);
    }
}
