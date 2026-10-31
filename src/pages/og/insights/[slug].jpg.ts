import type { APIRoute } from "astro";
import { coverPaths, jpgResponse } from "../../../lib/cover-routes";

export const getStaticPaths = () => coverPaths("insights");
export const GET: APIRoute = ({ props }) =>
  jpgResponse(props as never, "insights");
