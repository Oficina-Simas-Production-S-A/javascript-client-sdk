import { decodeTime } from "ulid";

import type { StickerCollection } from "../collections/StickerCollection.js";
import { type StickerParent, deleteSticker } from "../lib/stickers.js";

import type { User } from "./User.js";

/**
 * Sticker Class
 */
export class Sticker {
  readonly #collection: StickerCollection;
  readonly id: string;

  /**
   * Construct Sticker
   * @param collection Collection
   * @param id Sticker Id
   */
  constructor(collection: StickerCollection, id: string) {
    this.#collection = collection;
    this.id = id;
  }

  /**
   * Convert to string
   * @returns String
   */
  toString(): string {
    return this.name;
  }

  /**
   * Whether this object exists
   */
  get $exists(): boolean {
    return !!this.#collection.getUnderlyingObject(this.id).id;
  }

  /**
   * Time when this sticker was created
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Information about the parent of this sticker
   */
  get parent(): StickerParent {
    return this.#collection.getUnderlyingObject(this.id).parent;
  }

  /**
   * Server this sticker belongs to
   *
   * Undefined when the sticker came from a server we are not in, which is
   * normal: a sticker can be sent into any channel.
   */
  get server() {
    const parent = this.parent;
    return parent?.type === "Server"
      ? this.#collection.client.servers.get(parent.id)
      : undefined;
  }

  /**
   * Creator of the sticker
   */
  get creator(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).creatorId,
    );
  }

  /**
   * Name
   */
  get name(): string {
    return this.#collection.getUnderlyingObject(this.id).name;
  }

  /**
   * What the sticker is
   */
  get description(): string {
    return this.#collection.getUnderlyingObject(this.id).description;
  }

  /**
   * URL to the sticker image
   */
  get url(): string {
    return `${this.#collection.client.configuration?.features.autumn.url}/stickers/${
      this.id
    }`;
  }

  /**
   * Delete Sticker
   */
  async delete(): Promise<void> {
    await deleteSticker(this.#collection.client, this.id);

    const sticker = this.#collection.getUnderlyingObject(this.id);
    if (sticker) {
      this.#collection.client.emit("stickerDelete", sticker);
      this.#collection.delete(this.id);
    }
  }
}
