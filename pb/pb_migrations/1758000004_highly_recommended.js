/// <reference path="../pb_data/types.d.ts" />
// "Highly recommended" marker: a flag independent of watch status, toggled by the
// heart button in the app.
migrate((app) => {
  const c = app.findCollectionByNameOrId("watchlist_items");
  c.fields.add(new BoolField({ name: "highly_recommended" }));
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("watchlist_items");
  c.fields.removeByName("highly_recommended");
  app.save(c);
});
