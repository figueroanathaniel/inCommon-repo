export type NumerologyProfile = {
  lifePath: number;
  expression: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  maturity: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  karmicLessons: number[];
  lifePathSteps: string;
};

const MASTER = new Set([11, 22, 33]);

export function reduceNumber(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && MASTER.has(n))) {
    n = String(n)
      .split("")
      .reduce((s, c) => s + parseInt(c, 10), 0);
  }
  return n;
}

const letterValue = (ch: string) => ((ch.charCodeAt(0) - 65) % 9) + 1;

export function numerologyEngine(
  fullName: string,
  birthDate: string,
  today: Date = new Date()
): NumerologyProfile {
  const [y, m, d] = birthDate.split("-").map((n) => parseInt(n, 10));
  const letters = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("");
  const vowels = new Set(["A", "E", "I", "O", "U"]);

  const rm = reduceNumber(m);
  const rd = reduceNumber(d);
  const ry = reduceNumber(y);
  const lifePath = reduceNumber(rm + rd + ry);
  const expression = reduceNumber(letters.reduce((s, c) => s + letterValue(c), 0));
  const soulUrge = reduceNumber(letters.filter((c) => vowels.has(c)).reduce((s, c) => s + letterValue(c), 0));
  const personality = reduceNumber(letters.filter((c) => !vowels.has(c)).reduce((s, c) => s + letterValue(c), 0));
  const birthday = reduceNumber(d);
  const maturity = reduceNumber(lifePath + expression);

  const personalYear = reduceNumber(reduceNumber(m, false) + reduceNumber(d, false) + reduceNumber(today.getFullYear(), false), false);
  const personalMonth = reduceNumber(personalYear + today.getMonth() + 1, false);
  const personalDay = reduceNumber(personalMonth + today.getDate(), false);

  const present = new Set(letters.map(letterValue));
  const karmicLessons = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !present.has(n));

  return {
    lifePath,
    expression,
    soulUrge,
    personality,
    birthday,
    maturity,
    personalYear,
    personalMonth,
    personalDay,
    karmicLessons,
    lifePathSteps: `${m} → ${rm} · ${d} → ${rd} · ${y} → ${ry}  ⇒  ${rm + rd + ry} → ${lifePath}`,
  };
}
