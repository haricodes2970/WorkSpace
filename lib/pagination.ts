/**
 * Cursor-based pagination utilities.
 * Cursor = base64-encoded JSON (field + value) for stable ordering under mutations.
 * Pure functions. No I/O.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage:     boolean;
  hasPreviousPage: boolean;
  startCursor:     string | null;
  endCursor:       string | null;
  totalCount?:     number;
}

export interface PaginatedResult<T> {
  items:    T[];
  pageInfo: PageInfo;
}

export interface CursorPayload {
  field: string;
  value: string | number;
  id:    string;
}

// ─── Cursor encoding ──────────────────────────────────────────────────────────

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8")) as CursorPayload;
  } catch {
    return null;
  }
}

// ─── Pagination params ────────────────────────────────────────────────────────

export interface PaginationParams {
  first?:  number;    // forward pagination
  after?:  string;    // cursor
  last?:   number;    // backward pagination
  before?: string;    // cursor
}

export function parsePaginationParams(
  params: PaginationParams,
  defaults = { pageSize: 20, maxPageSize: 100 }
): { take: number; skip: number; cursor?: CursorPayload } {
  const pageSize = Math.min(params.first ?? params.last ?? defaults.pageSize, defaults.maxPageSize);
  const cursorStr = params.after ?? params.before;
  const cursor = cursorStr ? decodeCursor(cursorStr) : undefined;

  return { take: pageSize, skip: cursor ? 1 : 0, cursor };
}

// ─── Result builder ───────────────────────────────────────────────────────────

export function buildPaginatedResult<T extends { id: string; createdAt: Date }>(
  items:      T[],
  take:       number,
  totalCount?: number
): PaginatedResult<T> {
  const hasNextPage = items.length > take;
  const slice       = hasNextPage ? items.slice(0, take) : items;

  const first = slice[0];
  const last  = slice[slice.length - 1];

  return {
    items: slice,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: false,
      startCursor: first
        ? encodeCursor({ field: "createdAt", value: first.createdAt.getTime(), id: first.id })
        : null,
      endCursor: last
        ? encodeCursor({ field: "createdAt", value: last.createdAt.getTime(), id: last.id })
        : null,
      totalCount,
    },
  };
}

// ─── Simple offset pagination (for UI with page numbers) ─────────────────────

export interface OffsetPage {
  page:     number;
  pageSize: number;
  skip:     number;
  take:     number;
}

export function offsetPage(page: number, pageSize: number): OffsetPage {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 200);
  return {
    page:     safePage,
    pageSize: safeSize,
    skip:     (safePage - 1) * safeSize,
    take:     safeSize,
  };
}

export function totalPages(totalCount: number, pageSize: number): number {
  return Math.ceil(totalCount / Math.max(1, pageSize));
}
