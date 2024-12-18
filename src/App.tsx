import { GraphiQL } from "graphiql";
import { useState } from "react";
import { Fetcher, FetcherParams } from "@graphiql/toolkit";
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

const DEFAULT_QUERY = /* GraphQL */ `
  {
    search(query: "Winamp", first: 3) {
      edges {
        node {
          identifier
          title
          description
          files {
            filename
          }
        }
      }
    }
  }
`;

const fetcher: Fetcher = async (graphQLParams: FetcherParams) => {
  const result = await postMessageWithPromise(
    JSON.stringify({
      query: graphQLParams.query,
      variables: graphQLParams.variables,
      operationName: graphQLParams.operationName,
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
