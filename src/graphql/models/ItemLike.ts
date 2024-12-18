import { Ctx } from "../context.ts";
import { Collection } from "./Collection.ts";
import { ItemFile } from "./ItemFile.ts";
import { Item } from "./Item.ts";

/**
 * Under the hood, Collections are just a special type of Item. This interface
 * is used in places where either might be returned.
 * @gqlInterface
 */
export interface ItemLike {
  /**
   * The URL to view the Item on archive.org.
   * @gqlField */
  url(): string;
  /**
   * This identifier is a unique string naming the Item.
   * @gqlField */
  identifier(): string;
  /**
   * The title of the Item as provided by the uploader.
   * @gqlField */
  title(): string;
  /**
   * The description of the Item as provided by the uploader.
   * @gqlField */
  description(): string;
  /**
   * The files associated with this Collection. This will include the
   * Collection's metadata as well as its thumbnail.
   * @gqlField */
  files(): ItemFile[];
  /**
   * Collections to which this ItemLike belongs.
   * @gqlField */
  collections(): Promise<Collection>[];
}

/**
 * Retrieve an Item-like by its identifier. The Item-like may be an Item or a
 * Collection.
 *
 * @gqlQueryField */
export async function itemLike(
  identifier: string,
  ctx: Ctx
): Promise<ItemLike> {
  const response = await ctx.itemLoader.load(identifier);
  if (response.is_collection) {
    return new Collection(await ctx.itemLoader.load(identifier));
  }
  return new Item(await ctx.itemLoader.load(identifier));
}
