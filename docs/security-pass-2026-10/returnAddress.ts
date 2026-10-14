// Where Stripe sends the reader back. The page names its own address, so the
// same function serves the deploy preview, the live site and a local copy.
// The address must be one of ours; any other https origin is refused.
// (Tightened in the security pass of 12 October 2026: any https address used
// to be accepted. Nothing sensitive travels in the return URL, so this was
// hygiene rather than a hole. Add a custom domain to OWN() the day one
// exists; the --incommon.netlify.app suffix keeps deploy previews working.)
const OWN = (u: URL) =>
  u.hostname === "incommon.netlify.app" ||
  u.hostname.endsWith("--incommon.netlify.app") ||
  u.hostname === "localhost" ||
  u.hostname === "127.0.0.1";
function returnAddress(v: unknown): URL | null {
  try {
    const u = new URL(String(v ?? ""));
    if (u.protocol === "https:" && OWN(u)) return u;
    if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return u;
  } catch { /* not an address */ }
  return null;
}
