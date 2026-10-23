/**
 * Converts a local wall-clock birth date/time in an IANA timezone into a UTC Date.
 * Works in both browser and server (uses Intl only).
 */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== "literal") parts[p.type] = parseInt(p.value, 10);
  }
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - instant.getTime();
}

export function birthInstant(
  date: string,
  time: string | null | undefined,
  timeZone: string
): Date {
  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = (time && /^\d{1,2}:\d{2}/.test(time) ? time : "12:00")
    .split(":")
    .map((n) => parseInt(n, 10));
  const wall = Date.UTC(y, m - 1, d, hh, mm, 0);
  let tz = "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    tz = timeZone;
  } catch {
    tz = "UTC";
  }
  let offset = tzOffsetMs(new Date(wall), tz);
  let utc = wall - offset;
  offset = tzOffsetMs(new Date(utc), tz);
  utc = wall - offset;
  return new Date(utc);
}
