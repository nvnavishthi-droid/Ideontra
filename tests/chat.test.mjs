// chat.test.mjs — Verify private model context, provider limits and persistence failure handling.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
// Load API helpers with explicit fake dependencies and no network credentials.
function load(path, stubs = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  new Function('require', 'module', 'exports', code)(
    (name) => name === 'server-only' ? {} : stubs[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
const limits = load('src/lib/form-field-limits.ts');
const provider = load('src/lib/api/chat-provider.ts', { '@/lib/form-field-limits': limits });
const idea = { title:'Idea', problem:'A problem', solution:'A solution', author:'SECRET AUTHOR',
  ownerId:'SECRET UUID', demoUrl:'SECRET SIGNED URL', links:'SECRET LINK' };
// Build a minimal saved conversation row for isolated provider checks.
function message(role, content, state='complete', request_id='request') {
  return { role, content, state, request_id };
}
test('AI context excludes author, ownership identifiers, links and private demo URLs', () => {
  const context = provider.ideaChatContext(idea);
  assert.match(context, /A problem/);
  assert.doesNotMatch(context, /SECRET/);
});
test('model context is bounded and excludes old unanswered questions', () => {
  const messages = Array.from({length:40}, (_,i) => message(i%2?'assistant':'user', `row ${i}`));
  messages.push(message('user','failed question','failed','other'));
  messages.push(message('user','current question','pending','current'));
  const contents = provider.chatContents(messages,'current');
  assert.ok(contents.length<=20);
  assert.equal(contents[0].role,'user');
  assert.equal(contents.at(-1).parts[0].text,'current question');
  assert.ok(!JSON.stringify(contents).includes('failed question'));
  const huge = provider.chatContents([message('user','a'.repeat(16000)),message('assistant','b'.repeat(16000)),message('user','now','pending','current')],'current');
  assert.ok(JSON.stringify(huge).length<24500);
});
test('Google request pins Flash-Lite and rejects quota exhaustion without fallback', async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch = async (url, init) => {
    calls++; assert.match(url,/gemini-2\.5-flash-lite:generateContent$/);
    const body = JSON.parse(init.body);
    assert.equal(body.generationConfig.maxOutputTokens,2048);
    assert.equal(body.tools,undefined);
    assert.doesNotMatch(JSON.stringify(body),/SECRET/);
    return new Response('{}',{status:429});
  };
  try {
    await assert.rejects(() => provider.generateChatAnswer({ apiKey:'test', apiUrl:'https://generativelanguage.googleapis.com/v1beta', idea,
      messages:[message('user','question','pending')], requestId:'request' }),/free quota/);
    assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});
test('provider rejects blocked answers and excludes hidden thought parts', async () => {
  const original=globalThis.fetch;
  const input={apiKey:'test',apiUrl:'https://generativelanguage.googleapis.com/v1beta',idea,messages:[message('user','question')],requestId:'request'};
  try {
    globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'SAFETY'}]});
    await assert.rejects(()=>provider.generateChatAnswer(input),/Try rephrasing/);
    globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'hidden',thought:true},{text:'Visible answer'}]}}]});
    assert.equal(await provider.generateChatAnswer(input),'Visible answer');
  } finally {globalThis.fetch=original;}
});
// Stub orchestration while retaining the real input validation and RPC argument flow.
function server({ identity={id:'user'}, configured=true, fail=false }={}) {
  const calls=[]; const providerInputs=[];
  const api=load('src/lib/api/chat-server.ts', {
    '@/lib/supabase/server':{createClient:async()=>({})},
    './session':{getIdentity:async()=>identity},
    './ideas':{rpc:async(_client,name,args)=>{
      calls.push({name,args});
      if(name==='get_idea_detail')return {};
      if(name==='begin_idea_chat')return {complete:false,question_id:'22222222-2222-4222-8222-222222222222',lease_id:'33333333-3333-4333-8333-333333333333'};
      if(name==='get_idea_chat')return [];
    }},
    './idea-mapping':{mapDetail:()=>({idea})},
    './chat-client':{chatMessageSchema:require('zod').z.unknown()},
    './chat-provider':{generateChatAnswer:async(input)=>{providerInputs.push(input);if(fail)throw new Error('Google quota exhausted');return 'Answer';}},
    '@/lib/env':{getChatEnv:()=>configured?{apiKey:'key',apiUrl:'url',writeSecret:'secret',freeTierConfirmed:true}:{}},
    '@/lib/form-field-limits':limits,
  });
  return {...api,calls,providerInputs};
}
const question={ideaId:'11111111-1111-4111-8111-111111111111',requestId:'44444444-4444-4444-8444-444444444444',content:'Question'};
test('unauthenticated and unconfigured requests stop before persistence', async()=>{
  for(const options of [{identity:null},{configured:false}]){
    const api=server(options);await assert.rejects(()=>api.postChat(question));assert.equal(api.calls.length,0);
  }
});
test('provider failure preserves reserved question and records failed state for retry',async()=>{
  const api=server({fail:true});await assert.rejects(()=>api.postChat(question),/Google quota/);
  assert.deepEqual(api.calls.map(c=>c.name),['get_idea_detail','begin_idea_chat','get_idea_chat','finish_idea_chat']);
  assert.equal(api.calls.at(-1).args.p_answer,null);
  assert.equal(api.calls[1].args.p_request_id,question.requestId);
  assert.equal(api.calls[1].args.p_user_id,undefined);
  assert.equal(api.providerInputs[0].messages.at(-1).content,question.content);
  assert.equal(api.providerInputs[0].messages.at(-1).request_id,question.requestId);
});
