import type { Merge } from "../lib/merge.js";
import type { APISound, SoundParent } from "../lib/soundboard.js";

import type { Hydrate } from "./index.js";

export type HydratedSound = {
  id: string;
  parent: SoundParent;
  creatorId: string;
  name: string;
  emoji?: string;
};

export const soundHydration: Hydrate<Merge<APISound>, HydratedSound> = {
  keyMapping: {
    _id: "id",
    creator_id: "creatorId",
  },
  functions: {
    id: (sound) => sound._id,
    parent: (sound) => sound.parent,
    creatorId: (sound) => sound.creator_id,
    name: (sound) => sound.name,
    emoji: (sound) => sound.emoji,
  },
  initialHydration: () => ({}),
};
