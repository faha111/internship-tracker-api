import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

let server, base;
before(async () => {
  server = createApp(createDb(), 'test-secret').listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const call = (path, { method = 'GET', body, token } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });

async function signup(email) {
  await call('/auth/register', { method: 'POST', body: { email, password: 'password123' } });
  return (await (await call('/auth/login', { method: 'POST', body: { email, password: 'password123' } })).json()).token;
}

test('rejects short passwords and duplicate emails', async () => {
  assert.equal((await call('/auth/register', { method: 'POST', body: { email: 'a@b.com', password: 'x' } })).status, 400);
  await signup('dup@b.com');
  assert.equal((await call('/auth/register', { method: 'POST', body: { email: 'dup@b.com', password: 'password123' } })).status, 409);
});

test('protected routes need a token', async () => {
  assert.equal((await call('/applications')).status, 401);
});

test('full CRUD + stats', async () => {
  const token = await signup('crud@b.com');
  const created = await (await call('/applications', { method: 'POST', token, body: { company: 'WSO2', role: 'SE Intern' } })).json();
  assert.equal(created.status, 'applied');
  const upd = await (await call(`/applications/${created.id}`, { method: 'PATCH', token, body: { status: 'interview' } })).json();
  assert.equal(upd.status, 'interview');
  assert.equal((await call(`/applications/${created.id}`, { method: 'PATCH', token, body: { status: 'bogus' } })).status, 400);
  const stats = await (await call('/stats', { token })).json();
  assert.equal(stats.interview, 1);
  assert.equal((await call(`/applications/${created.id}`, { method: 'DELETE', token })).status, 204);
});

test("users cannot touch each other's data", async () => {
  const alice = await signup('alice@b.com');
  const bob = await signup('bob@b.com');
  const app = await (await call('/applications', { method: 'POST', token: alice, body: { company: 'IFS', role: 'Intern' } })).json();
  assert.equal((await call(`/applications/${app.id}`, { method: 'DELETE', token: bob })).status, 404);
  assert.deepEqual(await (await call('/applications', { token: bob })).json(), []);
});
