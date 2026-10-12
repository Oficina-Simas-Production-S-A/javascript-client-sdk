import type { Client } from "../Client.js";

import { request } from "./soundboard.js";

/**
 * Live clips: types and requests.
 *
 * Lives are not recorded (decided 12/10/2026). With clips on, the server
 * keeps a buffer of a live's last minutes — an `APIRecording` — while it
 * lasts and for a short while after, and clips are cut from it.
 *
 * Here and not in `stoat-api` for the same reason as the soundboard: the
 * published package does not carry these routes yet. Everything below
 * mirrors `crates/core/models/src/v0/recordings.rs`. Dates are milliseconds
 * since the Unix epoch.
 */

export type ConversionStatus = "queued" | "processing" | "ready" | "failed";
export type RecordingStatus = "recording" | "finished" | "failed";
export type ClipMode = "fast" | "precise";

export type APIRecordingPart = {
  /** Folder name, used to build the file links */
  folder: string;
  codec: "h265" | "h264";
  width: number;
  height: number;
  /** Where the part starts, in ms from the start of the live */
  offset_ms: number;
  duration_ms: number;
  size: number;
};

/** A live with clips on: the buffer of its last minutes */
export type APIRecording = {
  _id: string;
  server: string;
  channel: string;
  /** Who was sharing (and turned the clips on) */
  user: string;
  /** "recording" while the live goes on */
  status: RecordingStatus;
  stop_reason?: string;
  started_at: number;
  ended_at?: number;
  /** When the buffer goes (a few minutes after the live ends) */
  expires_at: number;
  /** How long the live has been going; the buffer holds only its end */
  duration_ms: number;
  size: number;
  parts: APIRecordingPart[];
  /** Signed link to the buffer, filled in by the list */
  access?: APIRecordingAccess;
};

export type APIClip = {
  _id: string;
  server: string;
  channel: string;
  recording: string;
  /** Who made the clip */
  user: string;
  /** Who was sharing */
  streamer: string;
  start_ms: number;
  end_ms: number;
  mode: ClipMode;
  status: ConversionStatus;
  /** 0 to 100 */
  progress: number;
  size: number;
  duration_ms: number;
  created_at: number;
  expires_at: number;
  error?: string;
  /** 1 = next in the conversion queue */
  queue_position?: number;
  /** Signed link to the files, filled in by the list */
  access?: APIRecordingAccess;
};

/** Space used by clips */
export type APIRecordingStorage = {
  used: number;
  quota: number;
  /** New clips are refused while set */
  blocked: boolean;
  /**
   * "cota" (clip quota reached), "disco" (disk nearly full) or "envios"
   * (the month's uploads to the bucket are used up)
   */
  reason?: string;
};

export type APIRecordingList = {
  recordings: APIRecording[];
  clips: APIClip[];
  storage: APIRecordingStorage;
};

/** Signed link to a live buffer's or clip's files */
export type APIRecordingAccess = {
  /** Base of the links, e.g. /gravador/arquivos/clipe/<id> */
  base: string;
  /** Query string to append to every link under `base` */
  query: string;
  expires_at: number;
};

/** Everything in a server the user may see, newest first */
export function fetchRecordings(
  client: Client,
  serverId: string,
): Promise<APIRecordingList> {
  return request(client, "GET", `/recordings/server/${serverId}`);
}

/**
 * Cut a clip from a live's buffer; it goes into the conversion queue. Times
 * are in ms from the start of the live; a start that already left the buffer
 * is pulled to the oldest moment it still holds (the clip comes back with
 * the stretch it really got). Fails with `ClipOutOfBuffer` if none of it is
 * left.
 */
export function createClip(
  client: Client,
  recordingId: string,
  data: { start_ms: number; end_ms: number; mode: ClipMode },
): Promise<APIClip> {
  return request(client, "POST", `/recordings/${recordingId}/clips`, data);
}

export function deleteRecording(
  client: Client,
  recordingId: string,
): Promise<void> {
  return request(client, "DELETE", `/recordings/${recordingId}`);
}

export function deleteClip(client: Client, clipId: string): Promise<void> {
  return request(client, "DELETE", `/recordings/clips/${clipId}`);
}

export function fetchRecordingAccess(
  client: Client,
  recordingId: string,
): Promise<APIRecordingAccess> {
  return request(client, "GET", `/recordings/${recordingId}/access`);
}

export function fetchClipAccess(
  client: Client,
  clipId: string,
): Promise<APIRecordingAccess> {
  return request(client, "GET", `/recordings/clips/${clipId}/access`);
}

/**
 * A link under a signed access: `link(access, "indice.json")`.
 */
export function recordingLink(
  access: APIRecordingAccess,
  path: string,
  extra?: Record<string, string>,
): string {
  const query = new URLSearchParams(access.query);
  for (const [key, value] of Object.entries(extra ?? {})) {
    query.set(key, value);
  }
  return `${access.base}/${path}?${query.toString()}`;
}
