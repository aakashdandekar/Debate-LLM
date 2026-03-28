<script setup>
import { inject } from 'vue'

const app = inject('appContext')

if (!app) {
  throw new Error('appContext was not provided')
}
</script>

<template>
  <main>
    <section v-show="app.state.currentView === 'auth'" id="auth-view" class="view">
      <div class="glass-card auth-container">
        <div class="auth-tabs">
          <button
            id="tab-login"
            class="auth-tab"
            :class="{ active: app.state.authMode === 'login' }"
            @click="app.switchAuthTab('login')"
          >
            Login
          </button>
          <button
            id="tab-register"
            class="auth-tab"
            :class="{ active: app.state.authMode === 'register' }"
            @click="app.switchAuthTab('register')"
          >
            Register
          </button>
        </div>

        <form
          v-show="app.state.authMode === 'login'"
          id="login-form"
          class="auth-form active"
          @submit.prevent="app.handleLogin()"
        >
          <h2>Welcome Back</h2>
          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              v-model.trim="app.state.loginForm.email"
              type="email"
              required
              placeholder="Enter your email"
            >
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              v-model="app.state.loginForm.password"
              type="password"
              required
              placeholder="Enter your password"
            >
          </div>
          <button type="submit" class="btn btn-primary full-width">Sign In</button>
        </form>

        <form
          v-show="app.state.authMode === 'register'"
          id="register-form"
          class="auth-form active"
          @submit.prevent="app.handleRegister()"
        >
          <h2>Create Account</h2>
          <div class="form-group">
            <label for="reg-name">Name</label>
            <input
              id="reg-name"
              v-model.trim="app.state.registerForm.name"
              type="text"
              required
              placeholder="Choose a username"
            >
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input
              id="reg-email"
              v-model.trim="app.state.registerForm.email"
              type="email"
              required
              placeholder="Enter your email"
            >
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input
              id="reg-password"
              v-model="app.state.registerForm.password"
              type="password"
              required
              placeholder="Create a password"
            >
          </div>
          <button type="submit" class="btn btn-primary full-width">Sign Up</button>
        </form>
      </div>
    </section>

    <section v-show="app.state.currentView === 'dashboard'" id="dashboard-view" class="view">
      <div class="dashboard-container">
        <div class="glass-card topic-card">
          <h2>Start a New Debate</h2>
          <div class="topic-generator">
            <button
              id="generate-topic-btn"
              class="btn btn-secondary"
              :disabled="app.state.isGeneratingTopic"
              @click="app.generateTopic()"
            >
              <span class="icon">{{ app.state.isGeneratingTopic ? '⏳' : '🎲' }}</span>
              {{ app.state.isGeneratingTopic ? 'Generating...' : 'Generate Topic' }}
            </button>
            <div class="form-group mt-15">
              <label for="debate-topic">Debate Topic</label>
              <input
                id="debate-topic"
                v-model.trim="app.state.draftTopic"
                type="text"
                placeholder="Generate or type a topic..."
                required
              >
            </div>
          </div>

          <div class="role-selection">
            <p class="role-label">Choose your stance:</p>
            <div class="role-options">
              <label class="role-card">
                <input v-model="app.state.role" type="radio" name="debate-role" value="For">
                <div class="role-content">
                  <span class="role-icon">👍</span>
                  <span class="role-name">For</span>
                </div>
              </label>
              <label class="role-card">
                <input
                  v-model="app.state.role"
                  type="radio"
                  name="debate-role"
                  value="Against"
                >
                <div class="role-content">
                  <span class="role-icon">👎</span>
                  <span class="role-name">Against</span>
                </div>
              </label>
            </div>
          </div>

          <button
            id="start-debate-btn"
            class="btn btn-primary full-width mt-20"
            @click="app.startDebate()"
          >
            Start Debate Session
          </button>
        </div>
      </div>
    </section>

    <section v-show="app.state.currentView === 'debate'" id="debate-view" class="view">
      <div class="debate-container glass-card">
        <div class="debate-header">
          <div class="debate-info">
            <h3>Active Topic</h3>
            <p id="active-topic-display">{{ app.state.activeTopic || 'Loading topic...' }}</p>
          </div>
          <div class="debate-actions">
            <span id="user-role-badge" class="badge badge-info">Role: {{ app.state.role }}</span>
            <button
              id="end-debate-btn"
              class="btn btn-danger btn-sm"
              :disabled="app.state.isLoadingVerdict"
              @click="app.endDebate()"
            >
              End Debate
            </button>
          </div>
        </div>

        <div id="chat-history" class="chat-history">
          <div
            v-for="message in app.state.chatMessages"
            :key="message.id"
            class="message"
            :class="message.sender"
          >
            <div class="message-content">{{ message.text }}</div>
          </div>

          <div v-if="app.state.isSystemTyping" class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>

        <form id="chat-form" class="chat-input-area" @submit.prevent="app.handleSendMessage()">
          <textarea
            id="chat-input"
            v-model="app.state.chatMessageDraft"
            placeholder="Type your argument..."
            required
            @keydown.enter.exact.prevent="app.handleSendMessage()"
          ></textarea>
          <button
            type="submit"
            id="send-btn"
            class="btn btn-primary send-btn"
            :disabled="app.state.isSendingMessage"
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
            </svg>
          </button>
        </form>
      </div>
    </section>

    <section v-show="app.state.currentView === 'verdict'" id="verdict-view" class="view">
      <div class="verdict-container glass-card">
        <div class="verdict-content" id="verdict-content-box">
          <div
            v-if="app.state.verdict.winner || app.state.verdict.userScore !== null"
            id="verdict-winner-box"
            class="verdict-winner"
            :class="{
              'winner-user': app.state.verdict.winner?.toLowerCase() === 'user',
              'winner-system': app.state.verdict.winner?.toLowerCase() !== 'user',
            }"
          >
            <h3>Winner</h3>
            <h2 id="verdict-winner-text">
              {{
                app.state.verdict.winner?.toUpperCase() === 'SYSTEM'
                  ? 'AI System'
                  : app.state.verdict.winner?.toUpperCase() === 'USER'
                    ? 'You'
                    : app.state.verdict.winner
              }}
            </h2>
          </div>
          <div v-if="app.state.verdict.userScore !== null" class="verdict-score-box">
            <span>Your Score:</span>
            <strong id="verdict-score" class="verdict-score">
              {{ app.state.verdict.userScore }}/10
            </strong>
          </div>
          <div id="verdict-text" class="verdict-text markdown-body">
            <template v-if="app.state.verdict.feedback || app.state.verdict.reasoning">
              <h4>Feedback</h4>
              <p class="verdict-copy">{{ app.state.verdict.feedback || 'No feedback provided.' }}</p>
              <h4>Reasoning</h4>
              <p class="verdict-copy">{{ app.state.verdict.reasoning || 'No reasoning provided.' }}</p>
            </template>
            <p v-else class="verdict-copy">{{ app.state.verdict.content }}</p>
          </div>
        </div>

        <div class="verdict-actions">
          <button
            id="back-to-dashboard-btn"
            class="btn btn-primary"
            @click="app.showView('dashboard')"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

input[type="text"],
input[type="email"],
input[type="password"],
textarea {
    width: 100%;
    background: var(--panel-input);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 12px 16px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s ease;
}

input:focus, textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.25);
}

textarea {
    resize: vertical;
    min-height: 100px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-family: inherit;
}

.btn-sm {
    padding: 8px 16px;
    font-size: 0.875rem;
}

.btn-primary {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.28);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(var(--accent-primary-rgb), 0.36);
    opacity: 0.95;
}

.btn-primary:active {
    transform: translateY(0);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
    background: rgba(var(--danger-rgb), 0.1);
    color: var(--danger);
    border: 1px solid rgba(var(--danger-rgb), 0.24);
}

.btn-danger:hover {
    background: rgba(var(--danger-rgb), 0.2);
}

/* Main.vue: auth screen */
.auth-container {
    max-width: 400px;
    width: 100%;
    margin: 40px auto;
}

.auth-tabs {
    display: flex;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 24px;
}

.auth-tab {
    flex: 1;
    background: none;
    border: none;
    padding: 12px;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    position: relative;
}

.auth-tab.active {
    color: var(--accent-primary);
}

.auth-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent-primary);
    border-radius: 2px;
}

.auth-form {
    display: none;
    animation: fadeIn 0.3s;
}

.auth-form.active {
    display: block;
}

/* Main.vue: dashboard / topic selection screen */
.dashboard-container {
    max-width: 600px;
    width: 100%;
    margin: 40px auto;
}

.topic-generator {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--glass-border);
}

.role-selection {
    margin-bottom: 24px;
}

.role-label {
    font-weight: 500;
    margin-bottom: 12px;
}

.role-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.role-card {
    cursor: pointer;
}

.role-card input {
    display: none;
}

.role-content {
    background: var(--panel-soft);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.role-icon {
    font-size: 2rem;
}

.role-name {
    font-weight: 600;
    color: var(--text-secondary);
}

.role-card input:checked + .role-content {
    border-color: var(--accent-primary);
    background: rgba(var(--accent-primary-rgb), 0.12);
    box-shadow: 0 0 15px rgba(var(--accent-primary-rgb), 0.16);
}

.role-card input:checked + .role-content .role-name {
    color: var(--text-primary);
}

.debate-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 120px);
    max-height: 800px;
    padding: 0;
    overflow: hidden;
}

.debate-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--glass-border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--panel-strong);
}

.debate-info h3 {
    margin-bottom: 4px;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.debate-info p {
    margin: 0;
    font-weight: 600;
    color: var(--text-primary);
}

.debate-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.badge {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
}

.badge-info {
    background: rgba(var(--accent-primary-rgb), 0.15);
    color: var(--accent-primary);
    border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
}

.chat-history {
    flex-grow: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
}

.message {
    display: flex;
    max-width: 80%;
    animation: fadeIn 0.3s ease-out;
}

.message.user {
    align-self: flex-end;
}

.message.system {
    align-self: flex-start;
}

.message-content {
    padding: 12px 16px;
    border-radius: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
}

.message.user .message-content {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    border-bottom-right-radius: 4px;
}

.message.system .message-content {
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-bottom-left-radius: 4px;
}

.typing-indicator {
    padding: 12px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    border-bottom-left-radius: 4px;
    display: inline-flex;
    gap: 4px;
    align-items: center;
    align-self: flex-start;
    animation: fadeIn 0.3s;
}

.typing-dot {
    width: 6px;
    height: 6px;
    background: var(--text-secondary);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

.chat-input-area {
    padding: 20px 24px;
    border-top: 1px solid var(--glass-border);
    background: var(--panel-strong);
    display: flex;
    gap: 12px;
}

.chat-input-area textarea {
    flex-grow: 1;
    min-height: 50px;
    height: 50px;
    resize: none;
    border-radius: 25px;
    padding: 14px 20px;
}

.send-btn {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    padding: 0;
}

.send-btn span {
    display: none;
}

.send-btn svg {
    margin: 0;
}

.verdict-container {
    max-width: 800px;
    width: 100%;
    margin: 40px auto;
    text-align: center;
}

.verdict-header {
    margin-bottom: 30px;
}

.verdict-content {
    background: var(--panel-soft);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 29px;
    text-align: left;
    margin-bottom: 5px;
}

.verdict-winner {
    text-align: center;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    background: var(--panel-deep);
    border: 1px solid var(--glass-border);
    transition: all 0.3s ease;
}

.verdict-winner.winner-user {
    border-color: var(--success);
    background: rgba(var(--success-rgb), 0.1);
    box-shadow: 0 0 15px rgba(var(--success-rgb), 0.2);
}

.verdict-winner.winner-user h2 {
    color: var(--success);
    font-size: 2rem;
    margin: 0;
}

.verdict-winner.winner-system {
    border-color: var(--accent-secondary);
    background: rgba(var(--accent-secondary-rgb), 0.12);
    box-shadow: 0 0 15px rgba(var(--accent-secondary-rgb), 0.2);
}

.verdict-winner.winner-system h2 {
    color: var(--accent-secondary);
    font-size: 2rem;
    margin: 0;
}

.verdict-winner h3 {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
}

.verdict-score-box {
    text-align: center;
    font-size: 1.1rem;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--glass-border);
    color: var(--text-secondary);
}

.verdict-score {
    color: var(--accent-primary);
    font-size: 1.5rem;
    margin-left: 8px;
}

.verdict-text h4 {
    color: var(--text-primary);
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}

.verdict-text {
    color: var(--text-secondary);
    line-height: 1.6;
}

.verdict-copy {
    white-space: pre-wrap;
}

.verdict-text strong {
    color: var(--text-primary);
}

@media (max-width: 768px) {
    .debate-container {
        height: calc(100vh - 100px);
    }
    
    .message {
        max-width: 90%;
    }
}
</style>
