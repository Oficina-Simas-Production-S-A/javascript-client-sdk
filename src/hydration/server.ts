import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import type {
  Server as APIServer,
  Category,
  SystemMessageChannels,
} from "stoat-api";

import type { Client } from "../Client.js";
import { File } from "../classes/File.js";
import { ServerRole } from "../classes/ServerRole.js";

import type { Hydrate } from "./index.js";

/**
 * A YouTube video in the watch party
 */
export type WatchTrack = {
  id: string;
  video_id: string;
  title: string;
  /** Id of the member who queued it */
  added_by: string;
  /** Second to start from */
  start?: number;
};

/**
 * Track playing now in the watch party
 */
export type WatchPlaying = {
  track: WatchTrack;
  /** Position in milliseconds at the instant `at` */
  position: number;
  playing: boolean;
  /** Server clock (Unix milliseconds) when `position` held */
  at: number;
};

/**
 * YouTube the members of a server watch together
 */
export type WatchParty = {
  version: number;
  /** Absent means true */
  everyone_controls?: boolean;
  current?: WatchPlaying;
  queue?: WatchTrack[];
};

/**
 * Server as sent by the API, with the watch party
 */
type ServerInput = APIServer & { watch_party?: WatchParty };

export type HydratedServer = {
  id: string;
  ownerId: string;

  name: string;
  description?: string;

  icon?: File;
  banner?: File;

  channelIds: ReactiveSet<string>;
  categories?: Category[];

  systemMessages?: SystemMessageChannels;
  roles: ReactiveMap<string, ServerRole>;
  defaultPermissions: bigint;

  flags: ServerFlags;
  analytics: boolean;
  discoverable: boolean;
  nsfw: boolean;

  watchParty?: WatchParty;
};

export const serverHydration: Hydrate<ServerInput, HydratedServer> = {
  keyMapping: {
    _id: "id",
    owner: "ownerId",
    channels: "channelIds",
    system_messages: "systemMessages",
    default_permissions: "defaultPermissions",
    watch_party: "watchParty",
  },
  functions: {
    id: (server) => server._id,
    ownerId: (server) => server.owner,
    name: (server) => server.name,
    description: (server) => server.description!,
    channelIds: (server) => new ReactiveSet(server.channels),
    categories: (server) => server.categories ?? [],
    systemMessages: (server) => server.system_messages ?? {},
    roles: (server, ctx) =>
      new ReactiveMap(
        Object.keys(server.roles!).map((id) => [
          id,
          new ServerRole(ctx as Client, server._id, id, server.roles![id]),
        ]),
      ),
    defaultPermissions: (server) => BigInt(server.default_permissions),
    icon: (server, ctx) => new File(ctx as Client, server.icon!),
    banner: (server, ctx) => new File(ctx as Client, server.banner!),
    flags: (server) => server.flags!,
    analytics: (server) => server.analytics || false,
    discoverable: (server) => server.discoverable || false,
    nsfw: (server) => server.nsfw || false,
    watchParty: (server) => server.watch_party!,
  },
  initialHydration: () => ({
    channelIds: new ReactiveSet(),
    roles: new ReactiveMap(),
  }),
};

/**
 * Flags attributed to servers
 */
export enum ServerFlags {
  Official = 1,
  Verified = 2,
}
