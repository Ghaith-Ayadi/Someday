/// <reference path="../pb_data/types.d.ts" />
// Someday: the one collection. Translated from supabase/migrations/001_watchlist.sql.
//
// Differences from Postgres, all deliberate:
//   - The old primary key was (user_id, id) and `id` is a client-made string like
//     "movie-tt0111161" or "manual-<uuid>" that can repeat across users. PocketBase
//     needs one unique id per record, so PocketBase mints its own and the client
//     value lives in `client_id`, unique per (user, client_id).
//   - `updated_at` (trigger-managed) becomes the built-in `updated` autodate.
//   - `genres text[]` becomes a json array.
//   - RLS "users manage own watchlist" becomes the same predicate on every rule.
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const own = '@request.auth.id != "" && user = @request.auth.id';

  const c = new Collection({
    name: "watchlist_items",
    type: "base",
    listRule: own,
    viewRule: own,
    createRule: own,
    updateRule: own,
    deleteRule: own,
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "client_id", type: "text", required: true, min: 1, max: 128 },
      { name: "imdb_id", type: "text" },
      { name: "media_type", type: "select", required: true, values: ["movie", "tv"], maxSelect: 1 },
      { name: "title", type: "text", required: true },
      { name: "poster_url", type: "text" },
      { name: "overview", type: "text" },
      { name: "release_date", type: "text" },
      { name: "vote_average", type: "number" },
      { name: "genres", type: "json", maxSize: 2000 },
      { name: "status", type: "select", required: true, values: ["watchlist", "watched"], maxSelect: 1 },
      { name: "added_at", type: "number", required: true },
      { name: "watched_at", type: "number" },
      { name: "deleted_at", type: "date" },
      { name: "manual", type: "bool" },
      { name: "director", type: "text" },
      { name: "actors", type: "text" },
      { name: "runtime", type: "text" },
      { name: "rated", type: "text" },
      { name: "writer", type: "text" },
      { name: "language", type: "text" },
      { name: "awards", type: "text" },
      { name: "metascore", type: "text" },
      { name: "imdb_rating", type: "text" },
      { name: "rotten_tomatoes", type: "text" },
      { name: "box_office", type: "text" },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_watchlist_user_client ON watchlist_items (user, client_id)",
      "CREATE INDEX idx_watchlist_user_updated ON watchlist_items (user, updated)",
    ],
  });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("watchlist_items");
  app.delete(c);
});
