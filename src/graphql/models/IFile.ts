import { Ctx } from "../context.ts";
import { ItemLike } from "./ItemLike.ts";

/**
 * A type which models a downloadable file.
 * @gqlInterface */
export interface IFile {
  /**
   * The filename of the file.
   * @gqlField */
  filename(): string;

  /**
   * A URL to download the file. This URL is not CORS-enabled, so it may not be
   * accessible from a web browser.
   * @gqlField */
  downloadUrl(): string;

  /**
   * A URL to download the file. This URL is CORS-enabled, so is safe to use to
   * `fetch` this URL from a web browser and inspect the resulting contents.
   * @gqlField */
  corsUrl(): string;

  /**
   * The item or collection to which this file belongs.
   * @gqlField
   */
  item(ctx: Ctx): Promise<ItemLike>;
}
