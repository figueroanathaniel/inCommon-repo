const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Resolves a horoscope period (daily/weekly/monthly) for a local date into a cache key, label, and representative instant. */
export function horoscopePeriod(period: "daily" | "weekly" | "monthly", localDate: string) {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (period === "daily") {
    return { key: localDate, label: `${MONTHS[m - 1]} ${d}, ${y}`, at: date };
  }
  if (period === "monthly") {
    return { key: `${y}-${String(m).padStart(2, "0")}`, label: `${MONTHS[m - 1]} ${y}`, at: new Date(Date.UTC(y, m - 1, 15, 12)) };
  }
  const dow = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date.getTime() - dow * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const mid = new Date(monday.getTime() + 3 * 86400000);
  const fmt = (x: Date) => `${MONTHS[x.getUTCMonth()].slice(0, 3)} ${x.getUTCDate()}`;
  return { key: monday.toISOString().slice(0, 10), label: `Week of ${fmt(monday)} – ${fmt(sunday)}`, at: mid };
}
