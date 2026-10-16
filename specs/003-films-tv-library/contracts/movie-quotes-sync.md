# Contract: Movie quotes sync (Phase B)

Mirror `specs/002-books-library/contracts/book-quotes-sync.md` with these substitutions:

- Entity: `MovieQuote` / table `movie_quotes`
- Parent FK: `movie_item_id` where `items.type = movie`
- Routes: `POST/GET /api/sync/movie-quotes/push` and `pull` (or shared quotes route with type discriminator — pick one in implementation, document here)

**Wire format**: `{ id, movieItemId, text, context?, createdAt, deletedAt?, fieldsUpdatedAt }`

**Rules**: per-field LWW; soft delete; two-user isolation tests required.
