import { Ctx } from "../context.ts";
import { SearchArgs } from "../models/SearchConnection.ts";

export type SearchResponseDoc = {
  identifier: string;
  collection: string[];
};
export type SearchResponse = {
  response: {
    docs: SearchResponseDoc[];
    numFound: number;
    start: number;
  };
};

export async function search(
  ctx: Ctx,
  query: string | null,
  rows: number,
  page: number,
  args: SearchArgs = {}
): Promise<SearchResponse> {
  const url = new URL("https://archive.org/advancedsearch.php");
  const querySegments: string[] = [];
  if (query) {
    querySegments.push(query);
  }

  if (args.collection) {
    querySegments.push(`collection:${args.collection}`);
  }

  url.searchParams.append(
    "q",
    querySegments.map((segment) => `(${segment})`).join(" AND ")
  );

  url.searchParams.append("fl[]", "identifier");
  url.searchParams.append("fl[]", "collection");

  url.searchParams.append("rows", rows.toString());
  url.searchParams.append("page", page.toString());
  url.searchParams.append("output", "json");
  const start = Date.now();
  const data = await fetchJSONP(url);
  const duration = Date.now() - start;

  // We fake a 200 status code because JSONP does not return status codes
  ctx.logNetworkRequest(url.toString(), 200, duration);
  return data;
}

let i = 0;

async function fetchJSONP(url: URL): Promise<SearchResponse> {
  const callbackFunction = `jsonp_${i++}`; // Unique callback name
  url.searchParams.append("callback", callbackFunction);

  const result = new Promise<SearchResponse>((resolve) => {
    // Define the callback function in the global scope
    // @ts-expect-error - We're defining a global function
    self[callbackFunction] = (data: SearchResponse) => {
      // @ts-expect-error - We're deleting the global function
      delete self[callbackFunction];
      resolve(data);
    };
  });

  await import(/* @vite-ignore */ url.toString());
  return result;
}
