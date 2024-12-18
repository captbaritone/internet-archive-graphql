import { Ctx } from "../context.ts";
import { IFile } from "./IFile.ts";
import { Item } from "./Item.ts";

/**
 * A file contained within a .zip archive within an Item at the Internet
 * Archive.
 * @gqlType */
export class ZipContent implements IFile {
  constructor(
    private itemIdentifier: string,
    private archiveFileName: string,
    private _filename: string
  ) {}

  /**
   * The filename of the file.
   * @gqlField */
  filename(): string {
    return this._filename;
  }

  /**
   * The item or collection to which this file belongs.
   * @gqlField
   */
  async item(ctx: Ctx): Promise<Item> {
    const item = await Item.item(this.itemIdentifier, ctx);
    if (item === null) {
      throw new Error("Item not found");
    }
    return item;
  }

  /**
   * A URL to download the file. This URL is not CORS-enabled, so it may not be
   * accessible from a web browser.
   * @gqlField */
  downloadUrl(): string {
    return `https://archive.org/download/${this.itemIdentifier}/${this.archiveFileName}/${this.filename}`;
  }

  /**
   * A URL to download the file. This URL is CORS-enabled, so is safe to use to
   * `fetch` this URL from a web browser and inspect the resulting contents.
   * @gqlField */
  corsUrl(): string {
    return `https://archive.org/cors/${this.itemIdentifier}/${this.archiveFileName}/${this.filename}`;
  }
}
