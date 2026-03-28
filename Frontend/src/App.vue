<script setup>
import { computed, onBeforeUnmount, provide, reactive } from 'vue'

import Header from '@/components/Header.vue'
import Main from '@/components/Main.vue'

const storedToken = localStorage.getItem('access_token') || ''
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const state = reactive({
  token: storedToken,
  currentView: storedToken ? 'dashboard' : 'auth',
  authMode: 'login',
  loginForm: {
    email: '',
    password: '',
  },
  registerForm: {
    name: '',
    email: '',
    password: '',
  },
  draftTopic: '',
  role: 'For',
  activeTopic: '',
  chatMessageDraft: '',
  chatMessages: [],
  isGeneratingTopic: false,
  isSendingMessage: false,
  isSystemTyping: false,
  isLoadingVerdict: false,
  verdict: {
    winner: '',
    userScore: null,
    feedback: '',
    reasoning: '',
    content: '',
  },
})

const notificationToast = reactive({
  visible: false,
  message: '',
  type: 'info',
  timeoutId: null,
})

const fullScreenToast = reactive({
  visible: false,
  message: '',
  type: 'info',
  timeoutId: null,
})

const isAuthenticated = computed(() => Boolean(state.token))

provide('appContext', {
  state,
  isAuthenticated,
  switchAuthTab,
  showView,
  handleLogin,
  handleRegister,
  generateTopic,
  startDebate,
  handleSendMessage,
  endDebate,
  handleLogout,
})

function switchAuthTab(tab) {
  state.authMode = tab
}

function showView(viewName) {
  state.currentView = viewName
}

function resetDebateState() {
  state.draftTopic = ''
  state.role = 'For'
  state.activeTopic = ''
  state.chatMessageDraft = ''
  state.chatMessages = []
  state.isGeneratingTopic = false
  state.isSendingMessage = false
  state.isSystemTyping = false
  state.isLoadingVerdict = false
  state.verdict = {
    winner: '',
    userScore: null,
    feedback: '',
    reasoning: '',
    content: '',
  }
}

function setToken(token) {
  localStorage.setItem('access_token', token)
  state.token = token
}

function clearToken() {
  localStorage.removeItem('access_token')
  state.token = ''
}

function clearToast(target) {
  if (target.timeoutId) {
    window.clearTimeout(target.timeoutId)
    target.timeoutId = null
  }
}

function showToast(message, type = 'info', fullScreen = false) {
  const target = fullScreen ? fullScreenToast : notificationToast

  clearToast(target)
  target.message = message
  target.type = type
  target.visible = true
  target.timeoutId = window.setTimeout(() => {
    target.visible = false
    target.timeoutId = null
  }, 3000)
}

function handleLogout() {
  clearToken()
  resetDebateState()
  state.authMode = 'login'
  state.currentView = 'auth'
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function buildApiUrl(path, query = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `${window.location.origin}${apiBaseUrl}`
  const url = new URL(`${baseUrl}${normalizedPath}`)

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

async function apiRequest(path, options = {}) {
  const { query, token, headers: customHeaders, ...fetchOptions } = options
  const headers = new Headers(customHeaders || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildApiUrl(path, query), {
    ...fetchOptions,
    headers,
  })
  const data = await parseResponse(response)

  return { response, data }
}

function getErrorMessage(payload, fallback) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    return payload.message || payload.detail || fallback
  }

  return fallback
}

function getTextPayload(payload, fallback = '') {
  if (typeof payload === 'string') {
    return payload
  }

  if (payload && typeof payload === 'object') {
    return payload.topic || payload.message || payload.response || payload['System-response'] || payload.verdict || fallback
  }

  return fallback
}

function setUnauthorizedState() {
  handleLogout()
  showToast('Your session has expired. Please sign in again.', 'error')
}

function appendMessage(text, sender) {
  state.chatMessages.push({
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
  })
}

async function handleLogin() {
  try {
    const { response, data } = await apiRequest('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.loginForm),
    })

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Login failed'))
    }

    if (!data?.access_token) {
      throw new Error('Login did not return an access token')
    }

    setToken(data.access_token)
    state.loginForm.password = ''
    state.currentView = 'dashboard'
    showToast('Login successful', 'success')
  } catch (error) {
    showToast(error.message || 'Invalid credentials', 'error')
  }
}

async function handleRegister() {
  try {
    const { response, data } = await apiRequest('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.registerForm),
    })

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Registration failed'))
    }

    state.loginForm.email = state.registerForm.email
    state.loginForm.password = ''
    state.registerForm = {
      name: '',
      email: '',
      password: '',
    }
    state.authMode = 'login'
    showToast('Registration successful! Please login.', 'success')
  } catch (error) {
    showToast(error.message || 'Error occurred', 'error')
  }
}

async function generateTopic() {
  state.isGeneratingTopic = true

  try {
    const { response, data } = await apiRequest('/get-topic')

    if (!response.ok) {
      throw new Error(getErrorMessage(data, 'Failed to fetch topic'))
    }

    state.draftTopic = getTextPayload(data, '').replace(/["']/g, '').trim()
    showToast('Topic generated', 'success')
  } catch (error) {
    showToast(error.message || 'Could not generate topic', 'error')
  } finally {
    state.isGeneratingTopic = false
  }
}

async function startDebate() {
  const topic = state.draftTopic.trim()

  if (!topic) {
    showToast('Please enter or generate a topic', 'error')
    return
  }

  try {
    const { response, data } = await apiRequest('/system/start-debate', {
      method: 'POST',
      token: state.token,
      query: {
        topic,
        role: state.role,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        setUnauthorizedState()
        return
      }

      throw new Error(getErrorMessage(data, 'Failed to start debate'))
    }

    state.activeTopic = topic
    state.chatMessageDraft = ''
    state.chatMessages = [
      {
        id: 'startup-message',
        sender: 'system',
        text:
          getTextPayload(
            data,
            `Debate has started on: "${topic}". You are arguing ${state.role.toUpperCase()} this topic. Please present your opening argument.`,
          ) ||
          `Debate has started on: "${topic}". You are arguing ${state.role.toUpperCase()} this topic. Please present your opening argument.`,
      },
    ]
    state.verdict = {
      winner: '',
      userScore: null,
      feedback: '',
      reasoning: '',
      content: '',
    }
    state.currentView = 'debate'
    showToast('Debate Started', 'success', true)
  } catch (error) {
    showToast(error.message || 'Failed to start debate', 'error')
  }
}

async function handleSendMessage() {
  const message = state.chatMessageDraft.trim()

  if (!message || state.isSendingMessage) {
    return
  }

  appendMessage(message, 'user')
  state.chatMessageDraft = ''
  state.isSendingMessage = true
  state.isSystemTyping = true

  try {
    const { response, data } = await apiRequest('/system/debate/system-response', {
      method: 'GET',
      token: state.token,
      query: {
        user_response: message,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        setUnauthorizedState()
        return
      }

      throw new Error(getErrorMessage(data, 'Failed to get response'))
    }

    appendMessage(getTextPayload(data, 'No response received'), 'system')
  } catch (error) {
    showToast(error.message || 'Error communicating with system', 'error')
    appendMessage('System error. Try sending your message again.', 'system')
  } finally {
    state.isSendingMessage = false
    state.isSystemTyping = false
  }
}

async function endDebate() {
  state.isLoadingVerdict = true

  try {
    const { response, data } = await apiRequest('/system/end-debate', {
      method: 'GET',
      token: state.token,
    })

    if (!response.ok) {
      if (response.status === 401) {
        setUnauthorizedState()
        return
      }

      throw new Error(getErrorMessage(data, 'Failed to end debate'))
    }

    state.verdict = {
      winner: typeof data === 'object' && data ? data.winner || '' : '',
      userScore:
        typeof data === 'object' && data && data.user_score !== undefined
          ? data.user_score
          : null,
      feedback: typeof data === 'object' && data ? data.user_feedback || '' : '',
      reasoning: typeof data === 'object' && data ? data.reasoning || '' : '',
      content:
        typeof data === 'string'
          ? data
          : getTextPayload(data, typeof data === 'object' ? JSON.stringify(data, null, 2) : ''),
    }

    state.currentView = 'verdict'
    showToast('Debate Concluded', 'success', true)
  } catch (error) {
    showToast(error.message || 'Error getting verdict', 'error')
  } finally {
    state.isLoadingVerdict = false
  }
}

onBeforeUnmount(() => {
  clearToast(notificationToast)
  clearToast(fullScreenToast)
})
</script>

<template>
  <div id="app">
    <div
      id="notification-toast"
      :class="[notificationToast.type, { show: notificationToast.visible }]"
    >
      {{ notificationToast.message }}
    </div>
    <div
      id="full-screen-toast"
      :class="[fullScreenToast.type, { show: fullScreenToast.visible }]"
    >
      {{ fullScreenToast.message }}
    </div>

    <div id="loading-overlay" :class="{ hidden: !state.isLoadingVerdict }">
      <div class="spinner"></div>
      <h2>Generating Verdict...</h2>
      <p>Please wait while the AI judge decides the outcome.</p>
    </div>
    <Header />
    <Main />
  </div>
</template>

<style scoped></style>
