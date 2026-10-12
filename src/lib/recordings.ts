import type { Client } from "../Client.js";

import { request } from "./soundboard.js";

/**
 * Live recordings and clips: types and requests.
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
  /** Where the part starts, in ms from the start of the recording */
  offset_ms: number;
  duration_ms: number;
  size: number;
};

export type APIRecordingCopy = {
  status: ConversionStatus;
  /** 0 to 100 */
  progress: number;
  size: number;
  expires_at: number;
  /** 1 = next in the conversion queue */
  queue_position?: number;
};

export type APIRecording = {
  _id: string;
  server: string;
  channel: string;
  /** Who was sharing */
  user: string;
  status: RecordingStatus;
  stop_reason?: string;
  started_at: number;
  ended_at?: number;
  expires_at: number;
  duration_ms: number;
  size: number;
  parts: APIRecordingPart[];
  thumbnail: boolean;
  copy?: APIRecordingCopy;
  /** Signed link to the files, filled in by the list */
  access?: APIRecordingAccess;
  /** Signed link to the H.264 copy, once ready */
  copy_access?: APIRecordingAccess;
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

export type APIRecordingStorage = {
  used: number;
  quota: number;
  /** New recordings, clips and copies are refused while set */
  blocked: boolean;
  /** "cota" (quota reached) or "disco" (disk nearly full) */
  reason?: string;
};

export type APIRecordingList = {
  recordings: APIRecording[];
  clips: APIClip[];
  storage: APIRecordingStorage;
};

/** Signed link to a recording's or clip's files */
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

/** Cut a clip; it goes into the conversion queue */
export function createClip(
  client: Client,
  recordingId: string,
  data: { start_ms: number; end_ms: number; mode: ClipMode },
): Promise<APIClip> {
  return request(client, "POST", `/recordings/${recordingId}/clips`, data);
}

/** Ask for (or reuse) the H.264 copy of a recording */
export function requestRecordingCopy(
  client: Client,
  recordingId: string,
): Promise<APIRecording> {
  return request(client, "POST", `/recordings/${recordingId}/copy`);
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

export function fetchRecordingCopyAccess(
  client: Client,
  recordingId: string,
): Promise<APIRecordingAccess> {
  return request(client, "GET", `/recordings/${recordingId}/copy/access`);
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
