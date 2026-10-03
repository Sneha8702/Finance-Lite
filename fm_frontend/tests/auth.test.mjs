import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import API, { loginUser, logoutUser, deleteAccount } from "../src/services/api.js";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key),
};
globalThis.window = { location: { href: "" } };
const reply = (config, data) => ({ config, data, status: 200, statusText: "OK", headers: {} });
const unauthorized = config => Promise.reject(new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, null, { status: 401, data: {} }));

test("concurrent unauthorized requests share refresh and store rotated tokens", async () => {
  values.clear();
  values.set("access", "old-access");
  values.set("refresh", "old-refresh");
  let refreshCalls = 0;
  axios.defaults.adapter = async config => {
    assert.equal(config.baseURL, API.defaults.baseURL);
    assert.equal(config.url, "/api/token/refresh/");
    refreshCalls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return reply(config, { access: "new-access", refresh: "new-refresh" });
  };
  API.defaults.adapter = config => config.headers.Authorization === "Bearer new-access"
    ? Promise.resolve(reply(config, { ok: true })) : unauthorized(config);
  const responses = await Promise.all([API.get("/user-details/"), API.get("/expense-overview/")]);
  assert.equal(refreshCalls, 1);
  assert.equal(values.get("refresh"), "new-refresh");
  assert.ok(responses.every(response => response.data.ok));
});

test("invalid login never refreshes or sends existing bearer token", async () => {
  let refreshCalls = 0;
  axios.defaults.adapter = () => { refreshCalls++; throw new Error("Must not refresh"); };
  API.defaults.adapter = config => {
    assert.equal(config.headers.Authorization, undefined);
    return unauthorized(config);
  };
  await assert.rejects(loginUser({ username: "alice", password: "wrong" }));
  assert.equal(refreshCalls, 0);
});

test("invalid refresh clears auth while preserving theme", async () => {
  values.set("theme", "light");
  API.defaults.adapter = unauthorized;
  axios.defaults.adapter = unauthorized;
  await assert.rejects(API.get("/user-details/"));
  assert.equal(values.get("access"), undefined);
  assert.equal(values.get("refresh"), undefined);
  assert.equal(values.get("theme"), "light");
  assert.equal(window.location.href, "/");
});

test("temporary refresh outage preserves session", async () => {
  values.set("access", "old-access");
  values.set("refresh", "old-refresh");
  API.defaults.adapter = unauthorized;
  axios.defaults.adapter = () => Promise.reject(new axios.AxiosError("Network error", "ERR_NETWORK"));
  await assert.rejects(API.get("/user-details/"));
  assert.equal(values.get("refresh"), "old-refresh");
});

test("logout waits for refresh and revokes rotated token", async () => {
  values.set("access", "old-access");
  values.set("refresh", "old-refresh");
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let started;
  const start = new Promise(resolve => { started = resolve; });
  let revoked = false;
  axios.defaults.adapter = async config => {
    if (config.url === "/api/token/refresh/") {
      started();
      await gate;
      return reply(config, { access: "new-access", refresh: "new-refresh" });
    }
    assert.equal(config.url, "/logout/");
    assert.equal(JSON.parse(config.data).refresh, "new-refresh");
    revoked = true;
    return reply(config, {});
  };
  API.defaults.adapter = config => config.headers.Authorization === "Bearer new-access"
    ? Promise.resolve(reply(config, {})) : unauthorized(config);
  const request = API.get("/user-details/").catch(() => {});
  await start;
  const logout = logoutUser();
  release();
  await Promise.all([request, logout]);
  assert.ok(revoked);
  assert.equal(values.get("access"), undefined);
  assert.equal(values.get("theme"), "light");
});


test("email verification request never attaches or refreshes bearer tokens", async () => {
  values.set("access", "existing-access");
  let refreshCalls = 0;
  axios.defaults.adapter = () => { refreshCalls++; throw new Error("Must not refresh"); };
  API.defaults.adapter = config => {
    assert.equal(config.headers.Authorization, undefined);
    return unauthorized(config);
  };
  await assert.rejects(API.post("/verify-email/", { token: "invalid" }));
  assert.equal(refreshCalls, 0);
});


test("account deletion clears session only after server success", async () => {
  values.set("access", "active");
  values.set("refresh", "refresh");
  values.set("theme", "light");
  API.defaults.adapter = config => Promise.reject(new axios.AxiosError("Wrong password", "ERR_BAD_REQUEST", config, null, { status: 400 }));
  await assert.rejects(deleteAccount("wrong"));
  assert.equal(values.get("access"), "active");
  API.defaults.adapter = config => {
    assert.equal(config.method, "delete");
    assert.equal(config.url, "/delete-account/");
    assert.deepEqual(JSON.parse(config.data), { password: "correct", confirm: true });
    return Promise.resolve(reply(config, {}));
  };
  await deleteAccount("correct");
  assert.equal(values.get("access"), undefined);
  assert.equal(values.get("refresh"), undefined);
  assert.equal(values.get("theme"), "light");
});
