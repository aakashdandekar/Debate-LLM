<script setup>
import { inject } from 'vue'

const app = inject('appContext')

if (!app) {
  throw new Error('appContext was not provided')
}
</script>

<template>
  <header>
    <div class="logo">
      <span class="logo-icon">⚖️</span>
      <h1>DebateX</h1>
    </div>
    <div v-if="app.isAuthenticated.value" id="user-info">
      <button id="logout-btn" class="btn btn-secondary btn-sm" @click="app.handleLogout">
        Sign Out
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 2rem;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo-icon {
    font-size: 2rem;
}

.logo h1 {
    margin: 0;
    background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
}

#user-info {
    display: flex;
    align-items: center;
}

#logout-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(135deg, var(--panel-strong), var(--panel-deep));
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(2, 6, 23, 0.24);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

#logout-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--accent-primary-rgb), 0.4);
    background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.2), rgba(var(--accent-secondary-rgb), 0.2));
    box-shadow: 0 14px 30px rgba(var(--accent-primary-rgb), 0.2);
}

#logout-btn:active {
    transform: translateY(0);
}

#logout-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.25), 0 14px 30px rgba(var(--accent-primary-rgb), 0.2);
}
</style>
