let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    currentUser = await checkAuth();
    
    if (currentUser) {
        // Display user info
        document.getElementById('user-name').textContent = currentUser.username;
        
        // Setup logout button
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        // Load leaderboard
        await loadLeaderboard();
    }
});

async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '<p class="loading">Loading leaderboard...</p>';
    
    try {
        const data = await apiCall('/api/leaderboard');
        
        if (data.count === 0) {
            leaderboardList.innerHTML = '<p class="no-data">No leaderboard data yet.</p>';
        } else {
            leaderboardList.innerHTML = createLeaderboardTable(data.data);
        }
    } catch (error) {
        showError('Failed to load leaderboard');
        leaderboardList.innerHTML = '<p class="error">Failed to load leaderboard. Please try again.</p>';
        console.error(error);
    }
}

function createLeaderboardTable(entries) {
    let html = '<div class="leaderboard-table">';
    
    entries.forEach((entry, index) => {
        const rank = index + 1;
        let rankIcon = '';
        
        if (rank === 1) rankIcon = '🥇';
        else if (rank === 2) rankIcon = '🥈';
        else if (rank === 3) rankIcon = '🥉';
        else rankIcon = `#${rank}`;
        
        const isCurrentUser = entry.userId._id === currentUser.id || entry.userId.username === currentUser.username;
        
        html += `
            <div class="leaderboard-row ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank">${rankIcon}</div>
                <div class="user-info">
                    <div class="username">${escapeHtml(entry.userId.username)}</div>
                    <div class="user-stats">
                        <span class="stat completed">✓ ${entry.tasksCompleted} completed</span>
                        <span class="stat incomplete">✗ ${entry.tasksIncomplete} incomplete</span>
                    </div>
                </div>
                <div class="score ${entry.score >= 0 ? 'positive' : 'negative'}">${entry.score}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
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
