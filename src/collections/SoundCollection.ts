import { Sound } from "../classes/Sound.js";
import type { HydratedSound } from "../hydration/sound.js";
import { type APISound, fetchSound } from "../lib/soundboard.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Soundboard Sounds
 */
export class SoundCollection extends ClassCollection<Sound, HydratedSound> {
  /**
   * Fetch sound by ID
   * @param id Id
   * @returns Sound
   */
  async fetch(id: string): Promise<Sound> {
    const sound = this.get(id);
    if (sound && !this.isPartial(id)) return sound;
    const data = await fetchSound(this.client, id);
    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   * @param isNew Whether this object is new
   */
  getOrCreate(id: string, data: APISound, isNew = false): Sound {
    if (this.has(id) && !this.isPartial(id)) {
      return this.get(id)!;
    } else {
      const instance = new Sound(this, id);
      this.create(id, "sound", instance, this.client, data);
      if (isNew) this.client.emit("soundCreate", instance);
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: string): Sound | undefined {
    if (this.has(id)) {
      return this.get(id)!;
    } else if (this.client.options.partials) {
      const instance = new Sound(this, id);
      this.create(id, "sound", instance, this.client, {
        id,
      });
      return instance;
    }
  }
}
