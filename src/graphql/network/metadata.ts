import { Ctx } from "../context.ts";

export type ItemResponse = {
  created: number;
  d1: string;
  d2: string;
  dir: string;
  files: ItemFileResponse[];
  item_last_updated: number;
  item_size: number;
  files_count: number;
  metadata: ItemResponseMetadata;
  server: string;
  uniq: number;
  workable_servers: string[];
  // Is this item a collection?
  is_collection?: boolean;
};

export type ItemResponseMetadata = {
  identifier: string;
  title: string;
  description: string;
  collection?: string | string[];
  language: string;
  mediatype: string;
  scanner: string;
  publicdate: string;
  uploader: string;
  addeddate: string;
  backup_location: string;
};

export type ItemFileResponse = {
  name: string;
  source: string;
  format: string;
  md5: string;

  mtime?: string;
  size?: string;
  crc32?: string;
  sha1?: string;
};

export async function loadItem(
  identifier: string,
  ctx: Ctx
): Promise<ItemResponse> {
  const url = `https://archive.org/metadata/${identifier}`;
  const start = Date.now();
  const data = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const duration = Date.now() - start;
  ctx.logNetworkRequest(url, data.status, duration);
  if (!data.ok) throw new Error("Failed to fetch item");
  return await data.json();
}
