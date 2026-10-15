# Quickstart: Book barcode scan (002)

**Prerequisites**: Muni v1 running locally (`001` quickstart); feature **002** implemented per `tasks.md`. **X1**: complete 002 before starting movie feature 003.

## Validate server lookup

1. Sign in; ensure network available.
2. `yarn db:up && yarn migrate:up` before first lookup if Postgres is fresh.
3. `curl -b cookies.txt "http://localhost:3000/api/books/lookup?isbn=9782070368228"` (session cookie from browser) → JSON hit with French/English title fields.
4. Repeat within TTL → same payload, `fetched_at` unchanged or served from cache (check logs).

## Validate mobile scan (manual / mocked)

1. Open books list on mobile viewport or device.
2. Tap **Scanner** → camera permission → point at ISBN barcode (or use dev hook to inject `9782070368228`).
3. Preview shows title, author, synopsis, genres; edit one field; save.
4. List shows one book; scan same ISBN again → same row updated, no duplicate.

## Validate desktop boundary

1. Desktop width: books list has no scan button; quick-add book has no scan or ISBN lookup controls.

## Validate lookup failure

1. Mock Open Library 404 for unknown ISBN → manual form with ISBN prefilled; save with title only.

## Validate soft-delete restore

1. Delete book with ISBN; undo or leave deleted; scan same ISBN → book restored with refreshed metadata.
