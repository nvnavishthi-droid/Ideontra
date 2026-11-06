// realtime.test.mjs — Verify delayed outage warnings with controlled channels and timers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
// Load the API with deterministic timers and a mock Realtime transport.
function setup() {
  const timers = new Map(); const channels = []; const warnings = []; let next = 0;
  const client = { realtime: { setAuth: async () => {} }, removeChannel: async () => {},
    channel: () => { const c = { on: () => c, subscribe: (cb) => { c.status = cb; } }; channels.push(c); return c; } };
  const mod = { exports: {} };
  const source = ts.transpileModule(readFileSync('src/lib/api/realtime.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require','module','exports','setTimeout','clearTimeout',source)(
    () => ({ createClient: () => client }), mod, mod.exports,
    (cb, ms) => { timers.set(++next, {cb,ms}); return next; }, (id) => timers.delete(id));
  const stop = mod.exports.subscribeIdeas({ id:'test', role:'admin' }, () => {}, (m) => warnings.push(m));
  // Advance the single outage timer without waiting in real time.
  function warn() { for (const [id,t] of [...timers]) if(t.ms===30000) { timers.delete(id);t.cb(); } }
  return { channels, warnings, timers, stop, warn };
}
test('brief outages are silent and all channels must recover before resetting', async () => {
 const s=setup(); await Promise.resolve();
 s.channels.forEach(c=>c.status('SUBSCRIBED'));
 s.channels[0].status('TIMED_OUT'); s.channels[1].status('CHANNEL_ERROR');
 assert.equal(s.timers.size,1); assert.equal(s.warnings.length,0);
 s.channels[0].status('SUBSCRIBED'); assert.equal(s.timers.size,1);
 s.channels[1].status('SUBSCRIBED'); s.warn(); assert.equal(s.warnings.length,0);s.stop();
});
test('persistent multi-channel outage warns once, then a recovered new outage may warn', async () => {
 const s=setup(); await Promise.resolve();
 s.channels.forEach(c=>c.status('CHANNEL_ERROR'));s.warn();
 s.channels.forEach(c=>c.status('TIMED_OUT'));s.warn();assert.equal(s.warnings.length,1);
 s.channels.forEach(c=>c.status('SUBSCRIBED'));
 s.channels[0].status('CLOSED');s.warn();assert.equal(s.warnings.length,2);s.stop();
});
test('cleanup cancels warning and ignores late channel callbacks', async () => {
 const s=setup();await Promise.resolve();s.channels[0].status('CHANNEL_ERROR');s.stop();
 s.channels[0].status('TIMED_OUT');s.warn();assert.equal(s.warnings.length,0);assert.equal(s.timers.size,0);
});
