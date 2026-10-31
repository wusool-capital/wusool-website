import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";
import { projectId, dataset } from "./env";

export default defineConfig({
  name: "wusool",
  title: "Wusool Capital",
  projectId,
  dataset,
  plugins: [
    structureTool({
      // Site settings is a single document, opened directly.
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site settings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (i) => i.getId() !== "siteSettings",
            ),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
});
