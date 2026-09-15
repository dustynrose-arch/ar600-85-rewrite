import assert from "node:assert/strict";
import { test } from "node:test";
import { cookieSecureFromRequest, sessionCookieOptions } from "./cookie-options.ts";
import { workspaceModeCookie, WORKSPACE_MODE_COOKIE } from "./workspace-mode.ts";

function requestFor(url: string, proto?: string): Request {
  const headers = proto ? { "x-forwarded-proto": proto } : undefined;
  return new Request(url, headers ? { headers } : undefined);
}

test("cookieSecureFromRequest is on for HTTPS and off for localhost HTTP", () => {
  const previous = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    assert.equal(cookieSecureFromRequest(requestFor("https://wg.example/")), true);
    assert.equal(cookieSecureFromRequest(requestFor("http://localhost:3000/", "https")), true);
    assert.equal(cookieSecureFromRequest(requestFor("http://localhost:3000/")), false);
    assert.equal(cookieSecureFromRequest(requestFor("http://127.0.0.1:3000/")), false);
  } finally {
    if (previous == null) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = previous;
  }
});

test("COOKIE_SECURE override wins over protocol", () => {
  const previous = process.env.COOKIE_SECURE;
  try {
    process.env.COOKIE_SECURE = "0";
    assert.equal(cookieSecureFromRequest(requestFor("https://wg.example/")), false);
    process.env.COOKIE_SECURE = "1";
    assert.equal(cookieSecureFromRequest(requestFor("http://localhost:3000/")), true);
  } finally {
    if (previous == null) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = previous;
  }
});

test("workspace cookie is SameSite=Lax and Secure only on HTTPS", () => {
  const httpsCookie = workspaceModeCookie("training", requestFor("https://wg.example/"));
  assert.equal(httpsCookie.name, WORKSPACE_MODE_COOKIE);
  assert.equal(httpsCookie.options.sameSite, "lax");
  assert.equal(httpsCookie.options.secure, true);
  assert.equal(httpsCookie.options.httpOnly, false);

  const localCookie = workspaceModeCookie("live", requestFor("http://localhost:3000/"));
  assert.equal(localCookie.options.sameSite, "lax");
  assert.equal(localCookie.options.secure, false);

  const shared = sessionCookieOptions(requestFor("https://example.com"));
  assert.equal(shared.sameSite, "lax");
  assert.equal(shared.secure, true);
});
