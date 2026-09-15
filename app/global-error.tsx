"use client";

/** Last-resort UI if the root layout throws. Dual-seal HeaderBrand may be unavailable. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-US">
      <body style={{ margin: 0, background: "#0b0c10", color: "#f4efe3", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 32 * 16, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
          <p style={{ color: "#e2b84a", fontSize: 11, fontWeight: 700, letterSpacing: "0.28em" }}>
            DRAFT TOOL — NOT AN OFFICIAL ARMY SYSTEM
          </p>
          <h1 style={{ fontSize: "1.5rem" }}>Draft tool could not load</h1>
          <p>
            Open <a href="/access" style={{ color: "#e2b84a" }}>/access</a> for the working-group
            gate. Confirm BLOB_READ_WRITE_TOKEN and WG_ACCESS_SECRET on Production, then Redeploy.
          </p>
          <p>
            <button type="button" onClick={() => reset()}>
              Try again
            </button>
          </p>
        </main>
      </body>
    </html>
  );
}
