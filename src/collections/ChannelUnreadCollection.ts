import { batch } from "solid-js";

import type { ChannelUnread as APIChannelUnread } from "stoat-api";

import { ChannelUnread } from "../classes/ChannelUnread.js";
import { Channel } from "../classes/index.js";
import type { HydratedChannelUnread } from "../hydration/channelUnread.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Channel Unreads
 */
export class ChannelUnreadCollection extends ClassCollection<
  ChannelUnread,
  HydratedChannelUnread
> {
  /**
   * Load unread information from server
   *
   * What comes back replaces whatever is held locally. It has to overwrite,
   * not fill gaps: the request takes a round trip, and anything reading
   * `Channel.unread` in the meantime — the sidebar, an unread badge — goes
   * through {@link for}, which registers an entry with no `last_id` at all.
   * Handing those entries back untouched would throw away every read marker
   * the server just sent, and the whole account would read as unread.
   */
  async sync(): Promise<void> {
    const unreads = await this.client.api.get("/sync/unreads");

    batch(() => {
      const fromServer = new Set<string>();

      for (const unread of unreads) {
        fromServer.add(unread._id.channel);
        this.overwrite(unread);
      }

      // A channel the server holds no record for has never been read, so any
      // marker sitting here is stale and has to go.
      for (const id of [...this.keys()]) {
        if (!fromServer.has(id)) this.delete(id);
      }
    });
  }

  /**
   * Write server data over the entry for a channel, creating it if needed
   * @param data Data
   */
  private overwrite(data: APIChannelUnread): ChannelUnread {
    const id = data._id.channel;
    const instance = this.get(id) ?? new ChannelUnread(this, id);

    // Re-hydrating keeps the instance the UI already holds a reference to,
    // and swaps the data underneath it.
    this.add(id, instance, this.hydrate("channelUnread", this.client, data));

    return instance;
  }

  /**
   * Clear all unread data
   */
  reset(): void {
    for (const id of [...this.keys()]) {
      this.delete(id);
    }
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   */
  getOrCreate(id: string, data: APIChannelUnread): ChannelUnread {
    if (this.has(id)) {
      return this.get(id)!;
    } else {
      const instance = new ChannelUnread(this, id);
      this.create(id, "channelUnread", instance, this.client, data);
      return instance;
    }
  }

  /**
   * Get channel unread data for a specific Channel
   * @param channel Channel
   * @returns Unread
   */
  for(channel: Channel): ChannelUnread {
    return this.getOrCreate(channel.id, {
      _id: {
        channel: channel.id,
        user: this.client.user!.id,
      },
      last_id: null,
      mentions: [],
    });
  }
}
