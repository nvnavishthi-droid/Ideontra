// chat.test.mjs — Verify the idea-chat Edge Function: private context, provider limits, persistence failures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const zod = require('zod');
// Load Deno function modules as CommonJS, mapping npm: specifiers and local imports to stubs.
function load(path, stubs = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const resolve = (name) => name === 'npm:zod@4.6.7' ? zod : stubs[name] ?? require(name);
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  return mod.exports;
}
const dir = 'supabase/functions/idea-chat';
const provider = load(`${dir}/provider.ts`);
const detail = { title:'Idea', category:'Societal', status:'submitted', problem:'A problem', proposed_solution:'A solution',
  who_benefits:null, expected_impact:null, rough_effort:null, impact_score:null, effort_score:null, evaluation_quadrant:null,
  author_name:'SECRET AUTHOR', owner_id:'SECRET UUID', demo_video_path:'SECRET SIGNED URL', links:['SECRET LINK'] };
const idea = provider.pickIdeaContent(detail);
// Build a minimal saved conversation row for isolated provider checks.
function message(role, content, state='complete', request_id='request') {
  return { role, content, state, request_id };
}
test('AI context excludes author, ownership identifiers, links and private demo URLs', () => {
  const context = provider.ideaChatContext(idea);
  assert.match(context, /A problem/);
  assert.match(context, /A solution/);
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
const apiUrl = 'https://generativelanguage.googleapis.com/v1beta';
test('Google request pins Flash-Lite and rejects quota exhaustion without fallback', async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch = async (url, init) => {
    calls++; assert.match(url,/gemini-3\.5-flash-lite:generateContent$/);
    const body = JSON.parse(init.body);
    assert.equal(body.generationConfig.maxOutputTokens,2048);
    assert.equal(body.tools,undefined);
    assert.doesNotMatch(JSON.stringify(body),/SECRET/);
    return new Response('{}',{status:429});
  };
  try {
    await assert.rejects(() => provider.generateChatAnswer({ apiKey:'test', apiUrl, idea,
      messages:[message('user','question','pending')], requestId:'request' }),/free quota/);
    assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});
test('a non-URL or wrong provider URL fails with a clear configuration error', async () => {
  for (const bad of ['AQ.not-a-url', 'https://example.com/v1beta', `${apiUrl}/`]) {
    await assert.rejects(() => provider.generateChatAnswer({ apiKey:'k', apiUrl:bad, idea,
      messages:[message('user','q','pending')], requestId:'request' }), /Chat provider configuration is invalid/);
  }
});
test('provider rejects blocked answers and excludes hidden thought parts', async () => {
  const original=globalThis.fetch;
  const input={apiKey:'test',apiUrl,idea,messages:[message('user','question')],requestId:'request'};
  try {
    globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'SAFETY'}]});
    await assert.rejects(()=>provider.generateChatAnswer(input),/Try rephrasing/);
    globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'hidden',thought:true},{text:'Visible answer'}]}}]});
    assert.equal(await provider.generateChatAnswer(input),'Visible answer');
  } finally {globalThis.fetch=original;}
});
// Run the real orchestration with stubbed RPCs and model.
function chat({ configured=true, fail=false }={}) {
  const calls=[]; const providerInputs=[];
  const mod=load(`${dir}/chat.ts`, { './provider.ts': provider });
  const deps={
    userId:'55555555-5555-4555-8555-555555555555',
    config: configured ? {apiKey:'key',apiUrl,writeSecret:'secret',freeTierConfirmed:true} : {freeTierConfirmed:false},
    rpc: async(name,args)=>{
      calls.push({name,args});
      if(name==='get_idea_detail')return detail;
      if(name==='begin_idea_chat')return {complete:false,question_id:'22222222-2222-4222-8222-222222222222',lease_id:'33333333-3333-4333-8333-333333333333'};
      if(name==='get_idea_chat')return [];
    },
    generate: async(input)=>{providerInputs.push(input);if(fail)throw new Error('Google quota exhausted');return 'Answer';},
  };
  return {...mod,deps,calls,providerInputs};
}
const question={ideaId:'11111111-1111-4111-8111-111111111111',requestId:'44444444-4444-4444-8444-444444444444',content:'Question'};
test('unconfigured and invalid requests stop before persistence', async()=>{
  const unconfigured=chat({configured:false});
  await assert.rejects(()=>unconfigured.handleChat(question,unconfigured.deps),/AI chat setup is incomplete/);
  assert.equal(unconfigured.calls.length,0);
  const invalid=chat();
  await assert.rejects(()=>invalid.handleChat({...question,userId:'someone-else'},invalid.deps));
  assert.equal(invalid.calls.length,0);
});
test('successful request saves the answer and returns the caller page', async()=>{
  const api=chat();
  const page=await api.handleChat(question,api.deps);
  assert.deepEqual(api.calls.map(c=>c.name),['get_idea_detail','begin_idea_chat','get_idea_chat','finish_idea_chat','get_idea_chat']);
  assert.equal(api.calls[3].args.p_answer,'Answer');
  assert.equal(api.calls[3].args.p_secret,'secret');
  assert.equal(page.userId,api.deps.userId);
  assert.doesNotMatch(JSON.stringify(api.providerInputs[0].idea),/SECRET/);
});
test('provider failure preserves reserved question and records failed state for retry',async()=>{
  const api=chat({fail:true});await assert.rejects(()=>api.handleChat(question,api.deps),/Google quota/);
  assert.deepEqual(api.calls.map(c=>c.name),['get_idea_detail','begin_idea_chat','get_idea_chat','finish_idea_chat']);
  assert.equal(api.calls.at(-1).args.p_answer,null);
  assert.equal(api.calls[1].args.p_request_id,question.requestId);
  assert.equal(api.calls[1].args.p_user_id,undefined);
  assert.equal(api.providerInputs[0].messages.at(-1).content,question.content);
  assert.equal(api.providerInputs[0].messages.at(-1).request_id,question.requestId);
});
test('clientError passes allow-listed messages and hides the rest', ()=>{
  const { clientError } = chat();
  const original=console.error; const logged=[]; console.error=(...a)=>logged.push(a.join(' '));
  try {
    assert.equal(clientError(new Error("Google's free quota is exhausted.")),"Google's free quota is exhausted.");
    assert.equal(clientError(new Error('Unauthorized')),'Chat is unavailable. Please retry.');
    assert.match(logged[0],/\[idea-chat\] unexpected error: Error: Unauthorized/);
  } finally {console.error=original;}
});
