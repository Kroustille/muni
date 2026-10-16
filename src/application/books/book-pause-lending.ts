import type { BookStatus } from "@/domain/item";

/** FR-B03: optional pages read while reading or paused. */
export function pagesReadApplicable(status: BookStatus): boolean {
  return status === "reading" || status === "paused";
}

export function normalizePagesReadForStatus(
  status: BookStatus,
  pagesRead: number | null,
): number | null {
  if (!pagesReadApplicable(status)) return null;
  return pagesRead;
}

export function validatePagesRead(
  status: BookStatus,
  pagesRead: number | null,
  pageCount: number | null,
): string | null {
  if (pagesRead === null) return null;
  if (!pagesReadApplicable(status)) {
    return "pagesRead only applies when status is reading or paused";
  }
  if (!Number.isInteger(pagesRead) || pagesRead < 0) {
    return "pagesRead must be a non-negative integer";
  }
  if (pageCount != null && pagesRead > pageCount) {
    return "pagesRead cannot exceed pageCount";
  }
  return null;
}

export function validateLoanPair(loanedTo: string | null, loanedAt: string | null): string | null {
  if (loanedTo == null && loanedAt != null) {
    return "loanedAt requires loanedTo";
  }
  return null;
}

export function loanReturnPatch(): { loanedTo: null; loanedAt: null } {
  return { loanedTo: null, loanedAt: null };
}

export function parsePagesReadInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}
