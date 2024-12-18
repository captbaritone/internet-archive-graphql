import { GraphiQL } from "graphiql";
import { useState } from "react";
import { Fetcher, FetcherOpts, FetcherParams } from "@graphiql/toolkit";
import { explorerPlugin } from "@graphiql/plugin-explorer";

import "graphiql/graphiql.css";
import "@graphiql/plugin-explorer/dist/style.css";
import "./App.css";

const worker = new Worker(new URL("./graphql/worker.ts", import.meta.url), {
  type: "module",
});

function postMessageWithPromise(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up the message handler
    const handleMessage = (event: MessageEvent<string>) => {
      resolve(event.data);
      worker.removeEventListener("message", handleMessage);
    };

    const handleError = (error: ErrorEvent) => {
      reject(error);
      worker.removeEventListener("error", handleError);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    // Send the message
    worker.postMessage(message);
  });
}

// Pass the explorer props here if you want
const explorer = explorerPlugin();

// prettier-ignore
const DEFAULT_QUERY = /* GraphQL */ `
# Internet Archive Client-Side GraphQL API
#
# This is a playground for exploring the open source Internet Archive
# Client-Side GraphQL API, a JavaScript module which allows you to issue GraphQL
# queries which are fulfilled by API requests directly from your browser to the
# Internet Archive's public REST APIs.
#
# There is no server-side component to this API, just JavaScript running in your
# browser that makes requests to archive.org.
#
# The goal is for Internet Archive Client-Side GraphQL API to provide an
# approachable abstraction to allow people to build simple to operate web
# applications which consume data from the Internet Archive.
#
# The Internet Archive Client-Side GraphQL API is not affiliated with the
# Internet Archive. It is an open source project created by the community on top
# of the Internet Archive's public APIs.
# 
# Learn more here: https://github.com/captbaritone/internet-archive-graphql/

query MyFirstQuery {
  # Search the Internet Archive for the term "screensavers" and return the first 3
  # items
  search(query: "screensavers", first: 3) {
    # The total number of items matching the search query
    count
    # The items matching the search query
    nodes {
      title
      thumbnail {
        downloadUrl
      }
      # Files contained within the item
      files {
        filename
        corsUrl
      }
    }
  }
}
`;

const fetcher: Fetcher = async (
  graphQLParams: FetcherParams,
  opts?: FetcherOpts
) => {
  const result = await postMessageWithPromise(
    JSON.stringify({
      query: graphQLParams.query,
      variables: graphQLParams.variables,
      operationName: graphQLParams.operationName,
      headers: opts?.headers,
    })
  );
  return JSON.parse(result);
};

export default function App() {
  const [query, setQuery] = useState(DEFAULT_QUERY);

  return (
    <GraphiQL
      fetcher={fetcher}
      query={query}
      onEditQuery={setQuery}
      plugins={[explorer]}
    />
  );
}
