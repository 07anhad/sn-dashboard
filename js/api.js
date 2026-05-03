/* ============================================================
   API.JS — Thin wrapper around fetch() for backend calls
   ============================================================ */

'use strict';

const API_BASE = '';  // same origin

async function api(path, opts = {}) {
  const { body, headers, ...rest } = opts;
  const u = getCurrentUser();
  const actor = u ? `${u.username}(${u.role})` : 'anonymous';
  const res = await fetch(API_BASE + path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', 'X-User': actor, ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Server returned non-JSON: ' + text.slice(0, 80)); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function apiGet(path)         { return api(path); }
function apiPost(path, body)  { return api(path, { method: 'POST', body }); }
function apiPut(path, body)   { return api(path, { method: 'PUT', body }); }
function apiDelete(path)      { return api(path, { method: 'DELETE' }); }
