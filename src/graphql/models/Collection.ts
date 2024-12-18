import { Int } from "grats";
import { Ctx } from "../context.ts";
import { ItemResponse } from "../network/metadata.ts";
import { ItemFile } from "./ItemFile.ts";
import { itemLike, ItemLike } from "./ItemLike.ts";
import { ItemSearchConnection, search } from "./SearchConnection.ts";

/**
 * All items must be part of a collection. A collection is simply an item with
 * special characteristics. Currently collections can only be created by
 * archive.org staff.
 *
 * @gqlType */
export class Collection implements ItemLike {
  constructor(private response: ItemResponse) {}
  /**
   * This identifier is a unique string identifying the collection.
   * @gqlField */
  identifier(): string {
    return this.response.metadata.identifier;
  }

  /**
   * The URL to view the collection on archive.org.
   * @gqlField */
  url(): string {
    return `https://archive.org/details/${this.response.metadata.identifier}`;
  }

  /**
   * The title of the collection as provided by the uploader.
   * @gqlField */
  title(): string {
    return this.response.metadata.title;
  }

  /**
   * The description of the collection as provided by the uploader.
   * @gqlField */
  description(): string {
    return this.response.metadata.description;
  }

  /**
   * The files associated with this Collection. This will include the
   * Collection's metadata as well as its thumbnail.
   * @gqlField */
  files(): ItemFile[] {
    return this.response.files.map(
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
   * Collections to which this Collection belongs.
   * @gqlField */
  collections(): Promise<Collection>[] {
    return this.collectionNames()
      .map((identifier) => Collection.collection(identifier, new Ctx()))
      .filter((collection) => collection !== null) as Promise<Collection>[];
  }

  /**
   * A paginateable list of items in this collection.
   * @gqlField */
  members(
    ctx: Ctx,
    first: Int = 10,
    after?: string | null
  ): Promise<ItemSearchConnection> {
    return search(ctx, null, first, { collection: this.identifier() }, after);
  }

  /**
   * Retrieve a collection by its identifier. If the identifier is not a
   * collection, this will error.
   *
   * @gqlQueryField */
  static async collection(
    identifier: string,
    ctx: Ctx
  ): Promise<Collection | null> {
    const item = await itemLike(identifier, ctx);
    if (!(item instanceof Collection)) {
      throw new Error("Item is not a collection");
    }
    return item;
  }
}
