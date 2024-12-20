import { Ctx } from "./context.ts";
import { getSchema } from "./schema.ts";
import { graphql } from "graphql";

const schema = getSchema();

// TODO: Support stream/defer?
self.onmessage = async (event) => {
  const { data } = event;
  const params = JSON.parse(data);
  console.log(params);
  const contextValue = new Ctx();
  const result = await graphql({
    schema,
    source: params.query,
    variableValues: params.variables,
    operationName: params.operationName,
    contextValue,
  });
  if (params.headers?.showNetworkRequests) {
    result.extensions = {
      ...result.extensions,
      networkRequests: contextValue.networkRequests,
    };
  }
  self.postMessage(JSON.stringify(result));
};
