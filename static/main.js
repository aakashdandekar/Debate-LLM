const state = {
    token: localStorage.getItem('access_token'),
    currentView: 'auth',
    topic: '',
    role: 'for'
};

const els = {
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    debateView: document.getElementById('debate-view'),
    verdictView: document.getElementById('verdict-view'),
    
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    userInfo: document.getElementById('user-info'),
    logoutBtn: document.getElementById('logout-btn'),
    
    genTopicBtn: document.getElementById('generate-topic-btn'),
    topicInput: document.getElementById('debate-topic'),
    startDebateBtn: document.getElementById('start-debate-btn'),
    roleInputs: document.querySelectorAll('input[name="debate-role"]'),
    
    chatHistory: document.getElementById('chat-history'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    activeTopicDisplay: document.getElementById('active-topic-display'),
    userRoleBadge: document.getElementById('user-role-badge'),
    endDebateBtn: document.getElementById('end-debate-btn'),
    
    verdictText: document.getElementById('verdict-text'),
    backToDashBtn: document.getElementById('back-to-dashboard-btn'),
    
    toast: document.getElementById('notification-toast'),
    loadingOverlay: document.getElementById('loading-overlay')
};

function init() {
    setupEventListeners();
    checkAuth();
}

function checkAuth() {
    if (state.token) {
        showView('dashboard');
        els.userInfo.classList.remove('hidden');
    } else {
        showView('auth');
        els.userInfo.classList.add('hidden');
    }
}

function showView(viewName) {
    state.currentView = viewName;
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    const viewEl = document.getElementById(`${viewName}-view`);
    if (viewEl) {
        viewEl.classList.add('active');
    }
}

function showToast(message, type = 'info') {
    els.toast.textContent = message;
    els.toast.className = `show ${type}`;
    
    setTimeout(() => {
        els.toast.className = 'hidden';
    }, 3000);
}

function setupEventListeners() {
    els.tabLogin.addEventListener('click', () => switchAuthTab('login'));
    els.tabRegister.addEventListener('click', () => switchAuthTab('register'));
    
    els.loginForm.addEventListener('submit', handleLogin);
    els.registerForm.addEventListener('submit', handleRegister);
    els.logoutBtn.addEventListener('click', handleLogout);
    
    els.genTopicBtn.addEventListener('click', generateTopic);
    els.startDebateBtn.addEventListener('click', startDebate);
    
    els.chatForm.addEventListener('submit', handleSendMessage);
    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    });
    els.endDebateBtn.addEventListener('click', endDebate);
    
    els.backToDashBtn.addEventListener('click', () => showView('dashboard'));
    
    els.roleInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.role = e.target.value;
        });
    });
}

function switchAuthTab(tab) {
    if (tab === 'login') {
        els.tabLogin.classList.add('active');
        els.tabRegister.classList.remove('active');
        els.loginForm.classList.add('active');
        els.registerForm.classList.remove('active');
    } else {
        els.tabRegister.classList.add('active');
        els.tabLogin.classList.remove('active');
        els.registerForm.classList.add('active');
        els.loginForm.classList.remove('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        
        if (data.access_token) {
            setToken(data.access_token);
            showToast('Login successful', 'success');
            checkAuth();
            els.loginForm.reset();
        }
    } catch (error) {
        showToast(error.message || 'Invalid credentials', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (!response.ok) throw new Error('Registration failed');
        
        showToast('Registration successful! Please login.', 'success');
        switchAuthTab('login');
        document.getElementById('login-email').value = email;
        els.registerForm.reset();
        
    } catch (error) {
        showToast(error.message || 'Error occurred', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('access_token');
    state.token = null;
    checkAuth();
}

function setToken(token) {
    localStorage.setItem('access_token', token);
    state.token = token;
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
    };
}

async function generateTopic() {
    els.genTopicBtn.disabled = true;
    els.genTopicBtn.innerHTML = '<span class="icon">⏳</span> Generating...';
    
    try {
        const response = await fetch('/get-topic');
        if (!response.ok) throw new Error('Failed to fetch topic');
        
        const topic = await response.json();
        els.topicInput.value = typeof topic === 'string' ? topic : (topic.topic || topic.message || JSON.stringify(topic)).replace(/["']/g, '');
        showToast('Topic generated', 'success');
    } catch (error) {
        showToast('Could not generate topic', 'error');
    } finally {
        els.genTopicBtn.disabled = false;
        els.genTopicBtn.innerHTML = '<span class="icon">🎲</span> Generate Topic';
    }
}

async function startDebate() {
    const topic = els.topicInput.value.trim();
    if (!topic) {
        showToast('Please enter or generate a topic', 'error');
        return;
    }
    
    state.topic = topic;
    
    try {
        const response = await fetch(`/system/start-debate?topic=${encodeURIComponent(topic)}&role=${encodeURIComponent(state.role)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!response.ok) {
            if(response.status === 401) handleLogout();
            throw new Error('Failed to start debate');
        }
        
        els.activeTopicDisplay.textContent = state.topic;
        els.userRoleBadge.textContent = `Role: ${state.role}`;
        
        els.chatHistory.innerHTML = `
            <div class="message system startup">
                <div class="message-content">
                    Debate has started on: "${state.topic}". You are arguing ${state.role.toUpperCase()} this topic. Please present your opening argument.
                </div>
            </div>
        `;
        
        showView('debate');
        showToast('Debate Started', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const message = els.chatInput.value.trim();
    if (!message) return;
    
    appendMessage(message, 'user');
    els.chatInput.value = '';
    
    const typingId = showTypingIndicator();
    
    try {
        const response = await fetch(`/system/debate/system-response?user_response=${encodeURIComponent(message)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        removeTypingIndicator(typingId);
        
        if (!response.ok) {
            if(response.status === 401) handleLogout();
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        const sysResponse = data["System-response"] || data.response || "No response received";
        
        appendMessage(sysResponse, 'system');
        
    } catch (error) {
        removeTypingIndicator(typingId);
        showToast('Error communicating with system', 'error');
        appendMessage("System error. Try sending your message again.", 'system');
    }
}

async function endDebate() {
    els.loadingOverlay.classList.remove('hidden');
    els.endDebateBtn.disabled = true;
    
    try {
        const response = await fetch('/system/end-debate', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!response.ok) {
            if(response.status === 401) handleLogout();
            throw new Error('Failed to end debate');
        }
        
        const data = await response.json();
        
        let resultObj = typeof data === 'string' ? null : data;
        if (typeof data === 'string') {
            try {
                resultObj = JSON.parse(data);
            } catch (e) {}
        }
        
        if (resultObj && (resultObj.winner || resultObj.user_score)) {
            const winnerBox = document.getElementById('verdict-winner-box');
            const scoreBox = document.querySelector('.verdict-score-box');
            if(winnerBox) winnerBox.style.display = 'block';
            if(scoreBox) scoreBox.style.display = 'block';

            document.getElementById('verdict-winner-text').textContent = 
                (resultObj.winner || '').toUpperCase() === 'SYSTEM' ? 'AI System' : ((resultObj.winner || '').toUpperCase() === 'USER' ? 'You' : resultObj.winner);
            
            document.getElementById('verdict-winner-box').className = 
                'verdict-winner ' + ((resultObj.winner || '').toLowerCase() === 'user' ? 'winner-user' : 'winner-system');
                
            document.getElementById('verdict-score').textContent = `${resultObj.user_score || 0}/10`;
            
            els.verdictText.innerHTML = `
                <h4>Feedback</h4>
                <p>${resultObj.user_feedback || 'No feedback provided.'}</p>
                <h4>Reasoning</h4>
                <p>${resultObj.reasoning || 'No reasoning provided.'}</p>
            `;
        } else {
            const winnerBox = document.getElementById('verdict-winner-box');
            const scoreBox = document.querySelector('.verdict-score-box');
            if(winnerBox) winnerBox.style.display = 'none';
            if(scoreBox) scoreBox.style.display = 'none';
            
            const verdictContent = typeof data === 'string' ? data : (data.verdict || JSON.stringify(data));
            if (window.marked) {
                els.verdictText.innerHTML = marked.parse(verdictContent);
            } else {
                els.verdictText.textContent = verdictContent;
            }
        }
        
        showView('verdict');
        showToast('Debate Concluded', 'success');
        
    } catch (error) {
        showToast('Error getting verdict', 'error');
    } finally {
        els.loadingOverlay.classList.add('hidden');
        els.endDebateBtn.disabled = false;
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'system' && window.marked) {
        contentDiv.innerHTML = marked.parse(text);
        contentDiv.classList.add('markdown-body');
    } else {
        contentDiv.textContent = text;
    }
    
    msgDiv.appendChild(contentDiv);
    els.chatHistory.appendChild(msgDiv);
    
    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
}

function showTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    els.chatHistory.appendChild(indicator);
    els.chatHistory.scrollTop = els.chatHistory.scrollHeight;
    
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

init();
