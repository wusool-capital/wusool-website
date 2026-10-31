import type { APIRoute } from "astro";
import { coverPaths, webpResponse } from "../../../lib/cover-routes";

export const getStaticPaths = () => coverPaths("insights");
export const GET: APIRoute = ({ props }) =>
  webpResponse(props as never, "insights");
