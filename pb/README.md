# Someday on PocketBase

- `pb_migrations/` is the schema, applied on every start. Edit in the admin UI
  only to prototype; PocketBase writes the resulting migration here (the
  directory is mounted read-only in production, so prototype on a laptop).
- `pb_hooks/` for server-side JS routes. Empty so far.
- Data lives on the box at `/srv/someday/pb_data`; secrets at `/srv/someday/.env`
  (see `compose/someday/.env.example` in Bedrock). Deployed by Bedrock at the
  ref in its `compose/someday/schema.env`.
