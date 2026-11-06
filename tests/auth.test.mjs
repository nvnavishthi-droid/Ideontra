// auth.test.mjs — Exercise server authentication validation and Supabase results.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
let calls = [];
let response = { data: { session: null }, error: null };
const client = {
  auth: {
    signUp: async (v) => {
      calls.push(v);
      return response;
    },
    signInWithPassword: async (v) => {
      calls.push(v);
      return response;
    },
    signOut: async () => response,
    exchangeCodeForSession: async () => response,
    verifyOtp: async () => response,
  },
};
// Transpile isolated API helpers with controlled transport and configuration.
function load(file) {
  const path = resolve(file);
  const mod = { exports: {} };
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  // Resolve only local TypeScript dependencies and replace the network transport.
  function localRequire(name) {
    if (name === "@/lib/supabase/server")
      return { createClient: async () => client };
    if (name === "@/lib/env")
      return { env: { siteUrl: "https://example.test" } };
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith(".")) return load(resolve(dirname(path), `${name}.ts`));
    return require(name);
  }
  new Function("require", "module", "exports", output)(
    localRequire,
    mod,
    mod.exports,
  );
  return mod.exports;
}
const { authenticate, signOut } = load("src/lib/api/auth.ts");
const values = {
  name: "Test Employee",
  email: "employee@closefuture.io",
  password: "example-password",
};
test("server rejects external domains and invalid signup names before network calls", async () => {
  calls = [];
  assert.ok(
    (await authenticate({ ...values, email: "employee@example.com" }, true))
      .error,
  );
  assert.ok(
    (await authenticate({ ...values, name: "Employee123" }, true)).error,
  );
  assert.equal(calls.length, 0);
});
test("signup returns immediately with a session and does not request email confirmation", async () => {
  calls = [];
  response = {
    data: { session: { access_token: "never-return" } },
    error: null,
  };
  assert.deepEqual(
    await authenticate({ ...values, email: " EMPLOYEE@closefuture.io " }, true),
    {},
  );
  assert.equal(calls[0].email, "employee@closefuture.io");
  assert.deepEqual(calls[0].options, { data: { full_name: "Test Employee" } });
});
test("sign-in and sign-out expose errors without exposing session tokens", async () => {
  response = {
    data: { session: { access_token: "never-return" } },
    error: null,
  };
  assert.deepEqual(await authenticate(values, false), {});
  assert.deepEqual(await signOut(), {});
  response = {
    data: { session: null },
    error: { message: "Invalid login credentials" },
  };
  assert.equal(
    (await authenticate(values, false)).error,
    "Invalid login credentials",
  );
  assert.equal((await signOut()).error, "Invalid login credentials");
});
test("signup without a session does not pretend the account is signed in", async () => {
  response = { data: { session: null }, error: null };
  const result = await authenticate(values, true);
  assert.match(result.error, /Signup did not create a session/);
  assert.ok(!("confirmation" in result));
});
