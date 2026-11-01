import { defineCliConfig } from "sanity/cli";
import { projectId, dataset } from "./env";

// Hosted Studio for editors: https://wusool-capital.sanity.studio
export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: "wusool-capital",
  deployment: { appId: "sifkoluqlhl4r47fuk464jpj" },
});
