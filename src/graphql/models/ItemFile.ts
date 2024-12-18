import { Ctx } from "../context.ts";
import { ItemFileResponse } from "../network/metadata.ts";
import { listZipContents } from "../network/zipContent.ts";
import { IFile } from "./IFile.ts";
import { itemLike, ItemLike } from "./ItemLike.ts";
import { ZipContent } from "./ZipContent.ts";

/**
 * A file associated with an Item on archive.org.
 *
 * @gqlType */
export class ItemFile implements IFile {
  constructor(
    private itemIdentifier: string,
    private response: ItemFileResponse
  ) {}

  /**
   * If this file is a .zip archive, it may contain multiple files. This field
   * will be null if the file is not a .zip archive, and will contain a list of
   * files if it is.
   * @gqlField */
  async zipContent(): Promise<ZipContent[] | null> {
    if (this.response.name.toLowerCase().endsWith(".zip")) {
      const fileNames = await listZipContents(this.corsUrl());
      return fileNames.map(
        (filename) =>
          new ZipContent(this.itemIdentifier, this.response.name, filename)
      );
    }
    return null;
  }

  /**
   * The filename of the file.
   * @gqlField */
  filename(): string {
    return this.response.name;
  }

  /**
   * A human readable name describing the type of file. Examples include:
   *
   * - "Metadata"
   * - "Archive BitTorrent"
   * @gqlField */
  format(): string {
    return this.response.format;
  }

  /**
   * Md5 hash of the file.
   *
   * @gqlField */
  md5(): string {
    return this.response.md5;
  }

  /**
   * The source of the file.
   * @gqlField
   */
  source(): string {
    return this.response.source;
  }

  /**
   * A URL to download the file. This URL is not CORS-enabled, so it may not be
   * accessible from a web browser.
   *
   * @gqlField */
  downloadUrl(): string {
    return `https://archive.org/download/${this.itemIdentifier}/${this.response.name}`;
  }

  /**
   * A URL to download the file. This URL is CORS-enabled, so is safe to use to
   * `fetch` this URL from a web browser and inspect the resulting contents.
   *
   * @gqlField */
  corsUrl(): string {
    return `https://archive.org/cors/${this.itemIdentifier}/${this.response.name}`;
  }

  /**
   * The item or collection to which this file belongs.
   * @gqlField */
  async item(ctx: Ctx): Promise<ItemLike> {
    return itemLike(this.itemIdentifier, ctx);
  }
}
