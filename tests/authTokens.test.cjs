'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function mockStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('persistAuthTokens writes accessToken, jwt mirror, and refreshToken', async () => {
  global.window = {};
  global.localStorage = mockStorage();
  const fileUrl = pathToFileURL(path.join(__dirname, '..', 'lib', 'authTokens.js')).href;
  const { persistAuthTokens, getAccessToken, getRefreshToken, clearAuthTokens } = await import(fileUrl);

  persistAuthTokens('access-jwt-value', 'refresh-secret');
  assert.equal(global.localStorage.getItem('accessToken'), 'access-jwt-value');
  assert.equal(global.localStorage.getItem('jwt'), 'access-jwt-value');
  assert.equal(global.localStorage.getItem('refreshToken'), 'refresh-secret');
  assert.equal(getAccessToken(), 'access-jwt-value');
  assert.equal(getRefreshToken(), 'refresh-secret');

  clearAuthTokens();
  assert.equal(getAccessToken(), null);
  assert.equal(getRefreshToken(), null);
  assert.equal(global.localStorage.getItem('accessToken'), null);
  assert.equal(global.localStorage.getItem('jwt'), null);
});

test('getAccessToken falls back to jwt when accessToken missing', async () => {
  global.window = {};
  global.localStorage = mockStorage();
  global.localStorage.setItem('jwt', 'legacy-jwt');
  const fileUrl = pathToFileURL(path.join(__dirname, '..', 'lib', 'authTokens.js')).href;
  const { getAccessToken } = await import(fileUrl);
  assert.equal(getAccessToken(), 'legacy-jwt');
});
