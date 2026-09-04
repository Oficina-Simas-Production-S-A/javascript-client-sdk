import { decodeTime } from "ulid";

import type { SoundCollection } from "../collections/SoundCollection.js";
import { type SoundParent, deleteSound } from "../lib/soundboard.js";

import type { User } from "./User.js";

/**
 * Soundboard Sound Class
 */
export class Sound {
  readonly #collection: SoundCollection;
  readonly id: string;

  /**
   * Construct Sound
   * @param collection Collection
   * @param id Sound Id
   */
  constructor(collection: SoundCollection, id: string) {
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
   * Time when this sound was created
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Information about the parent of this sound
   */
  get parent(): SoundParent {
    return this.#collection.getUnderlyingObject(this.id).parent;
  }

  /**
   * Server this sound belongs to
   */
  get server() {
    const parent = this.parent;
    return parent?.type === "Server"
      ? this.#collection.client.servers.get(parent.id)
      : undefined;
  }

  /**
   * Creator of the sound
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
   * Emoji shown alongside the sound
   */
  get emoji(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).emoji;
  }

  /**
   * URL to the sound file
   */
  get url(): string {
    return `${this.#collection.client.configuration?.features.autumn.url}/soundboard/${
      this.id
    }`;
  }

  /**
   * Delete Sound
   */
  async delete(): Promise<void> {
    await deleteSound(this.#collection.client, this.id);

    const sound = this.#collection.getUnderlyingObject(this.id);
    if (sound) {
      this.#collection.client.emit("soundDelete", sound);
      this.#collection.delete(this.id);
    }
  }
}
