/**
 * A type alias for cursors in this implementation.
 */
export type ConnectionCursor = string;

/**
 * A type describing the arguments a connection field receives in GraphQL.
 */
export interface ConnectionArguments {
  before?: ConnectionCursor | null;
  after?: ConnectionCursor | null;
  first?: number | null;
  last?: number | null;
}

/**
 * A type designed to be exposed as a `Connection` over GraphQL.
 */
export interface Connection<T> {
  edges: Array<RawEdge<T>>;
  pageInfo: PageInfo;
}

/**
 * A type designed to be exposed as a `Edge` over GraphQL.
 */
export interface RawEdge<T> {
  node: T;
  cursor: ConnectionCursor;
}

/** @gqlType */
export type Edge<T> = {
  /** @gqlField */
  cursor: string;

  /** @gqlField */
  node(): Promise<T>;
};

/**
 * Information about pagination in a connection.
 * @gqlType */
export type PageInfo = {
  /**
   * When paginating backwards, the cursor to continue.
   * @gqlField */
  startCursor: string | null;
  /**
   * "When paginating forwards, the cursor to continue.
   * @gqlField */
  endCursor: string | null;
  /**
   * When paginating backwards, are there more items?
   * @gqlField */
  hasPreviousPage: boolean | null;
  /**
   * When paginating forwards, are there more items?
   * @gqlField */
  hasNextPage: boolean | null;
};
