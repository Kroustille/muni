const ISBN10_LEN = 10;
const ISBN13_LEN = 13;

function digitsOnly(raw: string): string {
  return raw.replace(/[-\s]/g, "").toUpperCase();
}

function isbn13CheckDigit(twelve: string): number {
  let sum = 0;
  for (let i = 0; i < twelve.length; i++) {
    const digit = Number(twelve[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function isValidIsbn13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const body = value.slice(0, 12);
  const check = Number(value[12]);
  return isbn13CheckDigit(body) === check;
}

function isValidIsbn10(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < ISBN10_LEN; i++) {
    const ch = value[i];
    const digit = ch === "X" ? 10 : Number(ch);
    sum += digit * (ISBN10_LEN - i);
  }
  return sum % 11 === 0;
}

function isbn10ToIsbn13(isbn10: string): string {
  const core = `978${isbn10.slice(0, 9)}`;
  return `${core}${isbn13CheckDigit(core)}`;
}

export function isValidIsbn(raw: string): boolean {
  const compact = digitsOnly(raw);
  if (compact.length === ISBN13_LEN) return isValidIsbn13(compact);
  if (compact.length === ISBN10_LEN) return isValidIsbn10(compact);
  return false;
}

/** Normalize to ISBN-13 or throw if format/checksum is invalid. */
export function normalizeIsbn(raw: string): string {
  const compact = digitsOnly(raw);
  if (compact.length === ISBN13_LEN) {
    if (!isValidIsbn13(compact)) {
      throw new Error("Invalid ISBN-13 checksum");
    }
    return compact;
  }
  if (compact.length === ISBN10_LEN) {
    if (!isValidIsbn10(compact)) {
      throw new Error("Invalid ISBN-10 checksum");
    }
    return isbn10ToIsbn13(compact);
  }
  throw new Error("Invalid ISBN length");
}

/** Convert a 978-prefixed ISBN-13 to ISBN-10 for provider retry, or null when not applicable. */
export function isbn13ToIsbn10(isbn13: string): string | null {
  if (!isValidIsbn13(isbn13) || !isbn13.startsWith("978")) return null;
  const nine = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(nine[i]) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  const checkChar = check === 10 ? "X" : String(check);
  return `${nine}${checkChar}`;
}
