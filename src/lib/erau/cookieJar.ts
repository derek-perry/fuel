export type CookieMap = Record<string, string>;

// Parses raw `Set-Cookie` header lines into a name -> value map (ignores attributes like Path/Expires).
export function parseSetCookieHeaders(setCookieHeaders: string[]): CookieMap {
  const map: CookieMap = {};
  for (const header of setCookieHeaders) {
    const pair = header.split(";", 1)[0];
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

// Parses an outgoing `Cookie` header string ("a=1; b=2") into a map.
export function parseCookieHeader(header: string): CookieMap {
  const map: CookieMap = {};
  for (const part of header.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const name = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

export function cookieMapToHeader(map: CookieMap): string {
  return Object.entries(map)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}
