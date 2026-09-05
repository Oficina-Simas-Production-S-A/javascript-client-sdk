import type { Merge } from "../lib/merge.js";
import type { APISticker, StickerParent } from "../lib/stickers.js";

import type { Hydrate } from "./index.js";

export type HydratedSticker = {
  id: string;
  parent: StickerParent;
  creatorId: string;
  name: string;
  description: string;
};

export const stickerHydration: Hydrate<
  Merge<APISticker>,
  HydratedSticker
> = {
  keyMapping: {
    _id: "id",
    creator_id: "creatorId",
  },
  functions: {
    id: (sticker) => sticker._id,
    parent: (sticker) => sticker.parent,
    creatorId: (sticker) => sticker.creator_id,
    name: (sticker) => sticker.name,
    description: (sticker) => sticker.description,
  },
  initialHydration: () => ({}),
};
