async function request(path, { method = 'GET', body } = {}) {
  const options = { method, headers: {} }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`/api${path}`, options)
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }

  if (response.status === 204) return null

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Ha ocurrido un error inesperado')
  }

  return data
}

export const api = {
  getProfiles: () => request('/profiles'),
  createProfile: (data) => request('/profiles', { method: 'POST', body: data }),
  updateProfile: (id, data) => request(`/profiles/${id}`, { method: 'PUT', body: data }),
  deleteProfile: (id) => request(`/profiles/${id}`, { method: 'DELETE' }),

  getPresets: (profileId) => request(`/profiles/${profileId}/presets`),
  createPreset: (data) => request('/presets', { method: 'POST', body: data }),
  updatePreset: (id, data) => request(`/presets/${id}`, { method: 'PUT', body: data }),
  deletePreset: (id) => request(`/presets/${id}`, { method: 'DELETE' }),

  createSession: (data) => request('/sessions', { method: 'POST', body: data }),
  getSessions: (profileId, limit = 200) =>
    request(`/sessions?profileId=${profileId}&limit=${limit}`),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  getStats: (profileId, days = 90, today) =>
    request(`/stats?profileId=${profileId}&days=${days}&today=${today}`),
}
