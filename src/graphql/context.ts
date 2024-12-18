import DataLoader from "dataloader";
import { ItemResponse, loadItem } from "./network/metadata.ts";

type NetworkRequest = {
  url: string;
  status: number;
  duration: number;
};

/** @gqlContext */
export class Ctx {
  itemLoader: DataLoader<string, ItemResponse, string>;
  networkRequests: NetworkRequest[] = [];
  constructor() {
    this.itemLoader = new DataLoader((keys) => loadItems(keys, this));
  }

  logNetworkRequest(url: string, status: number, duration: number) {
    this.networkRequests.push({ url, status, duration });
  }
}

function loadItems(keys: readonly string[], ctx: Ctx): Promise<ItemResponse[]> {
  return Promise.all(keys.map((key) => loadItem(key, ctx)));
}
