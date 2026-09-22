import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { cookieSecureFromRequest } from "./cookie-options.ts";
import {
  accessErrorMessage,
  accessRedirectPath,
  decideAccessPost,
  readAccessSubmission,
  safeAccessNext,
  WG_ACCESS_COOKIE,
  wgAccessClearCookieOptions,
  wgAccessCookieOptions,
} from "./wg-access.ts";

const { renderToStaticMarkup } = createRequire(import.meta.url)("react-dom/server") as {
  renderToStaticMarkup: (element: ReturnType<typeof createElement>) => string;
};

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

test("access next path stays on this origin", () => {
  assert.equal(safeAccessNext("/"), "/");
  assert.equal(safeAccessNext(""), "/");
  assert.equal(safeAccessNext(null), "/");
  assert.equal(safeAccessNext("/guide"), "/guide");
  assert.equal(safeAccessNext("/guide?section=1"), "/guide?section=1");
  assert.equal(safeAccessNext("https://evil.example/phish"), "/");
  assert.equal(safeAccessNext("//evil.example"), "/");
  assert.equal(safeAccessNext("/\\/evil.example"), "/");
  assert.equal(safeAccessNext("/\\evil.example"), "/");
  assert.equal(safeAccessNext("\\\\/evil.example"), "/");
  assert.equal(safeAccessNext("/\t/evil.example"), "/");
  assert.equal(accessRedirectPath("ok", "/guide"), "/guide");
  assert.equal(accessRedirectPath("ok", "//evil.example"), "/");
  assert.equal(accessRedirectPath("denied", "/guide"), "/access?error=denied&from=%2Fguide");
  assert.equal(accessRedirectPath("denied", "/"), "/access?error=denied");
  assert.equal(accessRedirectPath("unconfigured", "/"), "/access?error=unconfigured");
  assert.equal(accessErrorMessage("denied"), "That working-group password is not correct.");
  assert.equal(accessErrorMessage("unconfigured"), "WG access secret is not configured.");
  assert.equal(accessErrorMessage("<script>"), null);
  assert.equal(accessErrorMessage(undefined), null);
});

test("form POST accepts urlencoded and multipart secrets without JSON", async () => {
  const urlencoded = new Request("https://wg.example/api/access", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ secret: "  correct-horse  ", from: "/guide" }),
  });
  const urlBody = await readAccessSubmission(urlencoded);
  assert.equal(urlBody.form, true);
  assert.equal(urlBody.secret, "correct-horse");
  assert.equal(urlBody.from, "/guide");
  assert.deepEqual(decideAccessPost(urlBody, "correct-horse"), {
    kind: "redirect",
    path: "/guide",
    setCookie: true,
  });

  const wrong = new Request("https://wg.example/api/access", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: "nope", from: "https://evil.example" }),
  });
  const wrongBody = await readAccessSubmission(wrong);
  assert.deepEqual(decideAccessPost(wrongBody, "correct-horse"), {
    kind: "redirect",
    path: "/access?error=denied",
    setCookie: false,
  });

  const form = new FormData();
  form.set("secret", "correct-horse");
  form.set("from", "//evil.example/phish");
  const multipart = new Request("https://wg.example/api/access?from=/tasks", {
    method: "POST",
    body: form,
  });
  const multiBody = await readAccessSubmission(multipart);
  assert.equal(multiBody.form, true);
  assert.equal(multiBody.secret, "correct-horse");
  assert.equal(multiBody.from, "/");
  assert.equal(decideAccessPost(multiBody, "correct-horse").kind, "redirect");
  assert.equal(decideAccessPost(multiBody, "").setCookie, false);
  assert.equal(decideAccessPost(multiBody, "").path, "/access?error=unconfigured");

  const json = new Request("https://wg.example/api/access?from=/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: "correct-horse" }),
  });
  const jsonBody = await readAccessSubmission(json);
  assert.equal(jsonBody.form, false);
  assert.equal(jsonBody.from, "/tasks");
  assert.deepEqual(decideAccessPost(jsonBody, "correct-horse"), { kind: "json", status: 200 });
  assert.deepEqual(decideAccessPost({ ...jsonBody, secret: "nope" }, "correct-horse"), {
    kind: "json",
    status: 401,
    error: "That working-group password is not correct.",
  });
  assert.deepEqual(decideAccessPost(jsonBody, ""), {
    kind: "json",
    status: 400,
    error: "WG access secret is not configured.",
  });
});

test("access password field is an uncontrolled native form POST", () => {
  const form = readFileSync(new URL("../components/WgAccessForm.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/access/page.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/access/route.ts", import.meta.url), "utf8");
  const logout = readFileSync(new URL("../components/LogOutButton.tsx", import.meta.url), "utf8");
  const accessLib = readFileSync(new URL("./wg-access.ts", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /httpEquiv="X-UA-Compatible"/);
  assert.match(layout, /content="IE=edge"/);
  assert.equal(layout.includes("EmulateIE"), false);
  assert.equal(layout.includes("IE=7"), false);
  assert.equal(layout.includes("IE=8"), false);
  assert.equal(layout.includes("IE=9"), false);
  assert.equal(layout.includes("IE=10"), false);
  for (const source of [form, page, route, logout, accessLib]) {
    assert.equal(source.includes("localStorage"), false);
    assert.equal(source.includes("sessionStorage"), false);
  }

  const password = form.slice(form.indexOf('type="password"'), form.indexOf("/>", form.indexOf('type="password"')));
  assert.equal(form.includes("use client"), false);
  assert.equal(form.includes("useState"), false);
  assert.equal(password.includes("value="), false);
  assert.equal(password.includes("defaultValue"), false);
  assert.equal(form.includes("onChange"), false);
  assert.equal(form.includes("onClick"), false);
  assert.equal(form.includes("onFocus"), false);
  assert.equal(form.includes("onSubmit"), false);
  assert.equal(form.includes("preventDefault"), false);
  assert.equal(form.includes("readOnly"), false);
  assert.equal(form.includes("disabled"), false);
  assert.equal(form.includes("pointer-events-none"), false);
  assert.equal(form.includes("fetch("), false);
  assert.equal(page.includes("UserGuideOverlay"), false);
  assert.equal(page.includes("DraftEditor"), false);
  assert.equal(page.includes("pointer-events-none"), false);
  assert.equal(page.includes("inset-0"), false);
  assert.match(form, /method="POST"/);
  assert.match(form, /action="\/api\/access"/);
  assert.match(form, /type="password"/);
  assert.match(form, /name="secret"/);
  assert.match(form, /autocomplete: "current-password"/);
  assert.equal(password.includes("autoComplete"), false);
  assert.match(form, /type="submit"/);
  assert.match(form, /name="from"/);
  const rendered = renderToStaticMarkup(
    createElement("input", {
      type: "password",
      name: "secret",
      autocomplete: "current-password",
    }),
  );
  assert.match(rendered, /^<input\b/);
  assert.match(rendered, /type="password"/);
  assert.match(rendered, /name="secret"/);
  assert.match(rendered, /autocomplete="current-password"/);
  assert.equal(rendered.includes("autoComplete"), false);
  assert.equal(rendered.includes("disabled"), false);
  assert.equal(rendered.includes("readonly"), false);
  assert.equal(rendered.includes("readOnly"), false);

  assert.match(page, /accessErrorMessage/);
  assert.match(page, /safeAccessNext/);
  assert.match(page, /<WgAccessForm error=\{error\} from=\{from\} \/>/);

  assert.match(route, /readAccessSubmission/);
  assert.match(route, /decideAccessPost/);
  assert.match(route, /NextResponse\.redirect\(new URL\(decision\.path, request\.url\), 303\)/);
  assert.match(route, /if \(decision\.setCookie\)/);
  assert.match(
    route,
    /response\.cookies\.set\(WG_ACCESS_COOKIE, await wgAccessCookieValue\(secret\), wgAccessCookieOptions\(request\)\)/,
  );
});

test("form success redirect carries the WG session cookie", () => {
  const previous = process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SECURE;
  try {
    const request = requestFor("https://wg.example/api/access");
    const response = NextResponse.redirect(new URL("/", request.url), 303);
    response.cookies.set(WG_ACCESS_COOKIE, "v1.session", wgAccessCookieOptions(request));
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "https://wg.example/");
    const header = response.headers.getSetCookie()[0];
    assert.ok(header);
    assert.match(header, new RegExp(`^${WG_ACCESS_COOKIE}=`));
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=lax/i);
    assert.match(header, /Path=\//);
    assert.equal(/max-age/i.test(header), false);
    assert.equal(/expires/i.test(header), false);
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
