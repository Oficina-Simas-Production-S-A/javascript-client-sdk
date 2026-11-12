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
 * A Spotify track in the listen party
 */
export type ListenTrack = {
  id: string;
  /** 22 base-62 characters; the URI is `spotify:track:<spotify_id>` */
  spotify_id: string;
  title: string;
  /** One line, names separated by ", " */
  artists: string;
  album?: string;
  cover?: string;
  /** Seconds */
  duration: number;
  /** Id of the member who queued it */
  added_by: string;
};

/**
 * Track playing now in the listen party
 */
export type ListenPlaying = {
  track: ListenTrack;
  /** Position in milliseconds at the instant `at` */
  position: number;
  playing: boolean;
  /** Server clock (Unix milliseconds) when `position` held */
  at: number;
};

/**
 * Spotify the members of a server listen to together, each on their own
 * account through the official player (the server only keeps them in sync)
 */
export type ListenParty = {
  version: number;
  /** Absent means true */
  everyone_controls?: boolean;
  current?: ListenPlaying;
  queue?: ListenTrack[];
  history?: { track: ListenTrack; at: number }[];
  /** Ids of who is listening, in the order they turned the sound on */
  viewers?: string[];
};

/**
 * Point of the banner kept in view, in percent of each axis
 * (the same as CSS `background-position`)
 */
export type BannerPosition = {
  /** 0 is the left edge, 100 the right edge */
  x: number;
  /** 0 is the top edge, 100 the bottom edge */
  y: number;
};

/**
 * Server as sent by the API, with the watch party and the banner position
 */
type ServerInput = APIServer & {
  watch_party?: WatchParty;
  listen_party?: ListenParty;
  banner_position?: BannerPosition;
};

export type HydratedServer = {
  id: string;
  ownerId: string;

  name: string;
  description?: string;

  icon?: File;
  banner?: File;
  bannerPosition?: BannerPosition;

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
  listenParty?: ListenParty;
};

export const serverHydration: Hydrate<ServerInput, HydratedServer> = {
  keyMapping: {
    _id: "id",
    owner: "ownerId",
    channels: "channelIds",
    system_messages: "systemMessages",
    default_permissions: "defaultPermissions",
    watch_party: "watchParty",
    listen_party: "listenParty",
    banner_position: "bannerPosition",
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
    bannerPosition: (server) => server.banner_position!,
    flags: (server) => server.flags!,
    analytics: (server) => server.analytics || false,
    discoverable: (server) => server.discoverable || false,
    nsfw: (server) => server.nsfw || false,
    watchParty: (server) => server.watch_party!,
    listenParty: (server) => server.listen_party!,
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
