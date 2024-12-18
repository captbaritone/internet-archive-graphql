import { Int } from "grats";
import { search as searchQuery, SearchResponseDoc } from "../network/search.ts";
import { Ctx } from "../context.ts";
import { itemLike, ItemLike } from "./ItemLike.ts";
import {
  connectionFromArraySlice,
  cursorToOffset,
} from "../helpers/arrayConnections.ts";
import { Edge, PageInfo } from "../helpers/connection.ts";

/**
 * Search results for items on archive.org with support for pagination.
 *
 * Provided by the Advanced Search API. See this URL for more information on
 * query syntax: https://archive.org/advancedsearch.php
 *
 * Implements the `Connection` spec: https://relay.dev/graphql/connections.htm
 * @gqlType */
export class ItemSearchConnection {
  constructor(
    private docs: { node: SearchResponseDoc; cursor: string }[],
    /** @gqlField */
    public count: Int,
    /** @gqlField */
    public pageInfo: PageInfo
  ) {}

  /** @gqlField */
  edges(ctx: Ctx): Edge<ItemLike>[] {
    return this.docs.map((edge) => ({
      cursor: edge.cursor,
      node: () => itemLike(edge.node.identifier, ctx),
    }));
  }

  /** @gqlField */
  nodes(ctx: Ctx): Promise<ItemLike>[] {
    return this.docs.map((edge) => itemLike(edge.node.identifier, ctx));
  }
}

/**
 * Structured search arguments for the search query.
 * @gqlInput */
export type SearchArgs = {
  /** The Collection in which to search */
  collection?: string;
};

/**
 * Search for Items on the Internet Archive and paginate the results.
 *
 * @gqlQueryField */
export async function search(
  ctx: Ctx,
  query: string | null,
  first: Int = 10,
  args: SearchArgs = {},
  after?: string | null
): Promise<ItemSearchConnection> {
  // Picked to balance overfetching and the number of requests needed for
  // typical page sizes.
  // TODO: We could optimize this number if startIndex is a multiple of count.
  const rowsPerPage = 50;

  const startIndex = after == null ? 0 : cursorToOffset(after);
  const count = first + 1; // Fetch one extra to determine if there are more

  const startPage = Math.floor(startIndex / rowsPerPage);
  const offset = startIndex % rowsPerPage;

  const rowsNeeded = offset + count;
  const pagesToFetch = Math.ceil(rowsNeeded / rowsPerPage);

  const docs: SearchResponseDoc[] = [];

  let countFound = 0;
  for (let i = 0; i < pagesToFetch; i++) {
    // TODO: We could fetch multiple pages in parallel here, but we'd want to
    // chunk to ensure we don't do too many in parallel.
    const response = await searchQuery(
      ctx,
      query,
      rowsPerPage,
      startPage + i,
      args
    );
    countFound = response.response.numFound;
    docs.push(...response.response.docs);
  }

  const connection = connectionFromArraySlice(
    docs,
    { first, after },
    { sliceStart: startIndex, arrayLength: countFound }
  );
  return new ItemSearchConnection(
    connection.edges,
    countFound,
    connection.pageInfo
  );
}
