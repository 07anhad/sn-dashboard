/* ============================================================
   API.JS — Thin wrapper around fetch() for backend calls
   ============================================================ */

'use strict';

const API_BASE = '';  // same origin

async function api(path, opts = {}) {
  const { body, headers, ...rest } = opts;
  const u     = getCurrentUser();
  const actor = u ? `${u.username}(${u.role})` : 'anonymous';

  let res;
  try {
    res = await fetch(API_BASE + path, {
      ...rest,
      headers: { 'Content-Type': 'application/json', 'X-User': actor, ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new Error('Failed to fetch — check your internet connection.');
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error('Server returned an unexpected response. Please try again.');
  }

  // 401 means the session is no longer valid on the server side.
  // Clear both storages and redirect to login so the user can re-authenticate.
  if (res.status === 401) {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
  return data;
}

function apiGet(path)        { return api(path); }
function apiPost(path, body) { return api(path, { method: 'POST', body }); }
function apiPut(path, body)  { return api(path, { method: 'PUT',  body }); }
function apiDelete(path)     { return api(path, { method: 'DELETE' }); }