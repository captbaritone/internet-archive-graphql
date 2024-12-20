import { Ctx } from "../context.ts";
import { ItemFileResponse, ItemResponse } from "../network/metadata.ts";
import { Collection } from "./Collection.ts";
import { ItemFile } from "./ItemFile.ts";
import { itemLike, ItemLike } from "./ItemLike.ts";

/**
 * Archive.org is made up of “items”. An Item is a logical “thing” that we
 * represent on one web page on archive.org. An Item can be considered as a
 * group of files that deserve their own metadata. If the files in an Item have
 * separate metadata, the files should probably be in different Items. An Item
 * can be a book, a song, an album, a dataset, a movie, an image or set of
 * images, etc. Every Item has an identifier that is unique across archive.org.
 *
 * https://archive.org/developers/items.html
 *
 * @gqlType */
export class Item implements ItemLike {
  constructor(private response: ItemResponse) {}

  /**
   * This identifier is a unique string naming the Item.
   * @gqlField */
  identifier(): string {
    return this.response.metadata.identifier;
  }

  /**
   * The URL to view the Item on archive.org.
   * @gqlField */
  url(): string {
    return `https://archive.org/details/${this.response.metadata.identifier}`;
  }

  /**
   * The title of the Item as provided by the uploader.
   * @gqlField */
  title(): string {
    return this.response.metadata.title;
  }

  /**
   * The description of the Item as provided by the uploader.
   * @gqlField */
  description(): string {
    return this.response.metadata.description;
  }

  /**
   * The Item's thumbnail file image.
   * @gqlField */
  thumbnail(): ItemFile | null {
    const file = this.response.files.find(
      (file) => file.format === "Item Tile"
    );
    if (file == null) {
      return null;
    }

    return new ItemFile(this.response.metadata.identifier, file);
  }

  /**
   * The files associated with this Item.
   * @gqlField */
  files(
    /**
     * Include files which are likely to be generated by the Internet Archive
     * such as thumbnail images and XML/SQLite metadata files.
     */
    includeMetadata?: boolean | null
  ): ItemFile[] {
    let files: ItemFileResponse[] = this.response.files;
    if (!includeMetadata) {
      files = files.filter((file) => {
        return (
          file.source !== "metadata" &&
          file.format !== "Metadata" &&
          file.format !== "Archive BitTorrent" &&
          file.format !== "Item Tile"
        );
      });
    }
    return files.map(
      (file) => new ItemFile(this.response.metadata.identifier, file)
    );
  }

  collectionNames(): string[] {
    const { collection } = this.response.metadata;
    if (collection === undefined) {
      return [];
    }
    if (typeof collection === "string") {
      return [collection];
    }
    return collection;
  }

  /**
   * Collections to which this Item belongs.
   * @gqlField */
  collections(): Promise<Collection>[] {
    return this.collectionNames()
      .map((identifier) => Collection.collection(identifier, new Ctx()))
      .filter((collection) => collection !== null) as Promise<Collection>[];
  }

  /**
   * Retrieve an Item by its identifier. This will error if the identifier is
   * the identifier of a collection.
   *
   * See Query.itemLike for a more general way to retrieve an Item or Collection.
   *
   * @gqlQueryField */
  static async item(identifier: string, ctx: Ctx): Promise<Item | null> {
    const item = await itemLike(identifier, ctx);
    if (!(item instanceof Item)) {
      throw new Error("Item is not an item");
    }
    return item;
  }
}
