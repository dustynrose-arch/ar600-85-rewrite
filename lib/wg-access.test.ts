import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { cookieSecureFromRequest } from "./cookie-options.ts";
import {
  WG_ACCESS_COOKIE,
  wgAccessClearCookieOptions,
  wgAccessCookieOptions,
} from "./wg-access.ts";

const { NextResponse } = createRequire(import.meta.url)("next/server") as {
  NextResponse: {
    json: (body: unknown) => {
      cookies: {
        set: (
          name: string,
          value: string,
          options: ReturnType<typeof wgAccessCookieOptions> | ReturnType<typeof wgAccessClearCookieOptions>,
        ) => void;
      };
      headers: { getSetCookie: () => string[] };
    };
  };
};

function requestFor(url: string, proto?: string): Request {
  const headers = proto ? { "x-forwarded-proto": proto } : undefined;
  return new Request(url, headers ? { headers } : undefined);
}

function setCookieHeader(
  value: string,
  options: ReturnType<typeof wgAccessCookieOptions> | ReturnType<typeof wgAccessClearCookieOptions>,
): string {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WG_ACCESS_COOKIE, value, options);
  const headers = response.headers.getSetCookie();
  assert.equal(headers.length, 1);
  return headers[0]!;
}

test("WG access cookie is a browser session cookie", () => {
  const previous = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    const https = requestFor("https://wg.example/");
    const options = wgAccessCookieOptions(https);
    assert.equal(options.path, "/");
    assert.equal(options.sameSite, "lax");
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.secure, cookieSecureFromRequest(https));
    assert.equal(Object.hasOwn(options, "maxAge"), false);
    assert.equal(Object.hasOwn(options, "expires"), false);
    assert.equal("domain" in options, false);

    const header = setCookieHeader("v1.session", options);
    assert.match(header, new RegExp(`^${WG_ACCESS_COOKIE}=`));
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=lax/i);
    assert.match(header, /Path=\//);
    assert.equal(/max-age/i.test(header), false);
    assert.equal(/expires/i.test(header), false);
    assert.equal(/domain/i.test(header), false);

    const local = wgAccessCookieOptions(requestFor("http://localhost:3000/"));
    assert.equal(local.secure, false);
    assert.equal(local.httpOnly, true);
    assert.equal(local.sameSite, "lax");
    const localHeader = setCookieHeader("v1.session", local);
    assert.equal(/\bSecure\b/.test(localHeader), false);
    assert.match(localHeader, /HttpOnly/);
    assert.equal(/max-age/i.test(localHeader), false);
    assert.equal(/expires/i.test(localHeader), false);
  } finally {
    if (previous == null) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = previous;
  }
});

test("logout clears ar60085-wg with Max-Age=0 and a past Expires", () => {
  const previous = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    const https = requestFor("https://wg.example/");
    const session = wgAccessCookieOptions(https);
    const clear = wgAccessClearCookieOptions(https);
    assert.equal(clear.path, session.path);
    assert.equal(clear.sameSite, session.sameSite);
    assert.equal(clear.secure, session.secure);
    assert.equal(clear.httpOnly, session.httpOnly);
    assert.equal(clear.maxAge, 0);
    assert.ok(clear.expires.getTime() <= 0);
    assert.equal("domain" in clear, false);

    const header = setCookieHeader("", clear);
    assert.match(header, new RegExp(`^${WG_ACCESS_COOKIE}=`));
    assert.match(header, /Max-Age=0/);
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=lax/i);
    assert.match(header, /Path=\//);
    assert.equal(/domain/i.test(header), false);
    const expires = /Expires=([^;]+)/i.exec(header);
    assert.ok(expires, header);
    assert.ok(Date.parse(expires[1]!) <= Date.now());

    const local = wgAccessClearCookieOptions(requestFor("http://127.0.0.1:3000/"));
    assert.equal(local.secure, false);
    assert.equal(local.httpOnly, true);
    assert.equal(local.maxAge, 0);
    const localHeader = setCookieHeader("", local);
    assert.match(localHeader, /Max-Age=0/);
    assert.match(localHeader, /HttpOnly/);
    assert.equal(/\bSecure\b/.test(localHeader), false);

    const forced = process.env.COOKIE_SECURE;
    process.env.COOKIE_SECURE = "1";
    try {
      const overridden = wgAccessClearCookieOptions(requestFor("http://localhost:3000/"));
      assert.equal(overridden.secure, true);
      assert.match(setCookieHeader("", overridden), /\bSecure\b/);
    } finally {
      if (forced == null) delete process.env.COOKIE_SECURE;
      else process.env.COOKIE_SECURE = forced;
    }
  } finally {
    if (previous == null) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = previous;
  }
});

test("access route sets a session cookie and DELETE clears it without a long maxAge", () => {
  const route = readFileSync(new URL("../app/api/access/route.ts", import.meta.url), "utf8");
  const access = readFileSync(new URL("./wg-access.ts", import.meta.url), "utf8");
  assert.match(
    route,
    /response\.cookies\.set\(WG_ACCESS_COOKIE, await wgAccessCookieValue\(secret\), wgAccessCookieOptions\(request\)\)/,
  );
  assert.match(route, /export async function DELETE/);
  assert.match(
    route,
    /response\.cookies\.set\(WG_ACCESS_COOKIE, "", wgAccessClearCookieOptions\(request\)\)/,
  );
  assert.equal(/maxAge\s*:/.test(route), false);
  assert.equal(route.includes("WG_ACCESS_MAX_AGE"), false);
  assert.equal(access.includes("WG_ACCESS_MAX_AGE"), false);
  assert.equal(access.includes("60 * 60 * 24 * 365"), false);
});
