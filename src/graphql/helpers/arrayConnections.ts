import { base64, unbase64 } from "./base64";

import type {
  Connection,
  ConnectionArguments,
  ConnectionCursor,
} from "./connection";

interface ArraySliceMetaInfo {
  sliceStart: number;
  arrayLength: number;
}

/**
 * A simple function that accepts an array and connection arguments, and returns
 * a connection object for use in GraphQL. It uses array offsets as pagination,
 * so pagination will only work if the array is static.
 */
export function connectionFromArray<T>(
  data: ReadonlyArray<T>,
  args: ConnectionArguments
): Connection<T> {
  return connectionFromArraySlice(data, args, {
    sliceStart: 0,
    arrayLength: data.length,
  });
}

/**
 * A version of `connectionFromArray` that takes a promised array, and returns a
 * promised connection.
 */
export function connectionFromPromisedArray<T>(
  dataPromise: Promise<ReadonlyArray<T>>,
  args: ConnectionArguments
): Promise<Connection<T>> {
  return dataPromise.then((data) => connectionFromArray(data, args));
}

/**
 * Given a slice (subset) of an array, returns a connection object for use in
 * GraphQL.
 *
 * This function is similar to `connectionFromArray`, but is intended for use
 * cases where you know the cardinality of the connection, consider it too large
 * to materialize the entire array, and instead wish pass in a slice of the
 * total result large enough to cover the range specified in `args`.
 */
export function connectionFromArraySlice<T>(
  arraySlice: ReadonlyArray<T>,
  args: ConnectionArguments,
  meta: ArraySliceMetaInfo
): Connection<T> {
  const { after, before, first, last } = args;
  const { sliceStart, arrayLength } = meta;
  const sliceEnd = sliceStart + arraySlice.length;

  let startOffset = Math.max(sliceStart, 0);
  let endOffset = Math.min(sliceEnd, arrayLength);

  const afterOffset = getOffsetWithDefault(after, -1);
  if (0 <= afterOffset && afterOffset < arrayLength) {
    startOffset = Math.max(startOffset, afterOffset + 1);
  }

  const beforeOffset = getOffsetWithDefault(before, endOffset);
  if (0 <= beforeOffset && beforeOffset < arrayLength) {
    endOffset = Math.min(endOffset, beforeOffset);
  }

  if (typeof first === "number") {
    if (first < 0) {
      throw new Error('Argument "first" must be a non-negative integer');
    }

    endOffset = Math.min(endOffset, startOffset + first);
  }
  if (typeof last === "number") {
    if (last < 0) {
      throw new Error('Argument "last" must be a non-negative integer');
    }

    startOffset = Math.max(startOffset, endOffset - last);
  }

  // If supplied slice is too large, trim it down before mapping over it.
  const slice = arraySlice.slice(
    startOffset - sliceStart,
    endOffset - sliceStart
  );

  const edges = slice.map((value, index) => ({
    cursor: offsetToCursor(startOffset + index),
    node: value,
  }));

  const firstEdge = edges[0];
  const lastEdge = edges[edges.length - 1];
  const lowerBound = after != null ? afterOffset + 1 : 0;
  const upperBound = before != null ? beforeOffset : arrayLength;
  return {
    edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
      hasPreviousPage:
        typeof last === "number" ? startOffset > lowerBound : false,
      hasNextPage: typeof first === "number" ? endOffset < upperBound : false,
    },
  };
}

/**
 * A version of `connectionFromArraySlice` that takes a promised array slice,
 * and returns a promised connection.
 */
export async function connectionFromPromisedArraySlice<T>(
  dataPromise: Promise<ReadonlyArray<T>>,
  args: ConnectionArguments,
  arrayInfo: ArraySliceMetaInfo
): Promise<Connection<T>> {
  const data = await dataPromise;
  return connectionFromArraySlice(data, args, arrayInfo);
}

const PREFIX = "arrayconnection:";

/**
 * Creates the cursor string from an offset.
 */
export function offsetToCursor(offset: number): ConnectionCursor {
  return base64(PREFIX + offset.toString());
}

/**
 * Extracts the offset from the cursor string.
 */
export function cursorToOffset(cursor: ConnectionCursor): number {
  return parseInt(unbase64(cursor).substring(PREFIX.length), 10);
}

/**
 * Return the cursor associated with an object in an array.
 */
export function cursorForObjectInConnection<T>(
  data: ReadonlyArray<T>,
  object: T
): ConnectionCursor | null {
  const offset = data.indexOf(object);
  if (offset === -1) {
    return null;
  }
  return offsetToCursor(offset);
}

/**
 * Given an optional cursor and a default offset, returns the offset
 * to use; if the cursor contains a valid offset, that will be used,
 * otherwise it will be the default.
 */
export function getOffsetWithDefault(
  cursor: ConnectionCursor | null | undefined,
  defaultOffset: number
): number {
  if (typeof cursor !== "string") {
    return defaultOffset;
  }
  const offset = cursorToOffset(cursor);
  return isNaN(offset) ? defaultOffset : offset;
}
