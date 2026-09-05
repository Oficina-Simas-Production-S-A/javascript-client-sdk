import { Sticker } from "../classes/Sticker.js";
import type { HydratedSticker } from "../hydration/sticker.js";
import { type APISticker, fetchSticker } from "../lib/stickers.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Stickers
 */
export class StickerCollection extends ClassCollection<
  Sticker,
  HydratedSticker
> {
  /**
   * Fetch sticker by ID
   * @param id Id
   * @returns Sticker
   */
  async fetch(id: string): Promise<Sticker> {
    const sticker = this.get(id);
    if (sticker && !this.isPartial(id)) return sticker;
    const data = await fetchSticker(this.client, id);
    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   * @param isNew Whether this object is new
   */
  getOrCreate(id: string, data: APISticker, isNew = false): Sticker {
    if (this.has(id) && !this.isPartial(id)) {
      return this.get(id)!;
    } else {
      const instance = new Sticker(this, id);
      this.create(id, "sticker", instance, this.client, data);
      if (isNew) this.client.emit("stickerCreate", instance);
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: string): Sticker | undefined {
    if (this.has(id)) {
      return this.get(id)!;
    } else if (this.client.options.partials) {
      const instance = new Sticker(this, id);
      this.create(id, "sticker", instance, this.client, {
        id,
      });
      return instance;
    }
  }
}
