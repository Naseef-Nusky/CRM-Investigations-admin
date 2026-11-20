const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

let accessToken = localStorage.getItem('accessToken') || null

export function setAccessToken(token) {
  accessToken = token
  if (token) localStorage.setItem('accessToken', token)
  else localStorage.removeItem('accessToken')
}

export function getAccessToken() {
  return accessToken
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    setAccessToken(null)
    localStorage.removeItem('user')
    throw new Error('Session expired')
  }
  const data = await res.json()
  setAccessToken(data.data.accessToken)
  localStorage.setItem('user', JSON.stringify(data.data.user))
  return data.data.accessToken
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && !options._retry) {
    try {
      await refreshAccessToken()
      return api(path, { ...options, _retry: true })
    } catch {
      // fall through
    }
  }

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(payload.message || 'Request failed')
    error.status = res.status
    error.payload = payload
    throw error
  }
  return payload
}

// Authenticated fetch that retries once after a token refresh. Used for non-JSON requests.
async function authFetch(path, init = {}, retried = false) {
  const headers = { ...(init.headers || {}) }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
  if (res.status === 401 && !retried) {
    try {
      await refreshAccessToken()
      return authFetch(path, init, true)
    } catch {
      // fall through
    }
  }
  return res
}

async function throwFromResponse(res) {
  const payload = await res.json().catch(() => ({}))
  const error = new Error(payload.message || 'Request failed')
  error.status = res.status
  error.payload = payload
  throw error
}

// Multipart upload. Content-Type is intentionally NOT set so the browser adds the boundary.
export async function apiUpload(path, formData) {
  const res = await authFetch(path, { method: 'POST', body: formData })
  if (!res.ok) await throwFromResponse(res)
  return res.json().catch(() => ({}))
}

// Fetch a protected file with auth and trigger a browser download.
export async function apiDownload(path, fallbackName = 'download') {
  const res = await authFetch(path)
  if (!res.ok) await throwFromResponse(res)
  const blob = await res.blob()
  let filename = fallbackName
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  if (match) filename = decodeURIComponent(match[1])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Absolute URL for a backend path (only useful for public endpoints; protected files need apiDownload).
export function fileUrl(path) {
  return `${API_URL}${path}`
}
