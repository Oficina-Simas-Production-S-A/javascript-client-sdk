import type { Client } from "../Client.js";

/**
 * Sticker types and requests.
 *
 * These live here rather than coming from `stoat-api` because that package is
 * generated from the published OpenAPI spec: until a release carries the
 * sticker routes, `client.api` cannot express them and would not type check.
 * Everything below mirrors `crates/core/models/src/v0/stickers.rs`.
 */

/** What owns a sticker */
export type StickerParent =
  | { type: "Server"; id: string }
  | { type: "Detached" };

/** Sticker as the API returns it */
export type APISticker = {
  _id: string;
  parent: StickerParent;
  creator_id: string;
  name: string;
  description: string;
};

/** Body for creating a sticker */
export type DataCreateSticker = {
  name: string;
  parent: StickerParent;
  description: string;
};

/** Body for editing a sticker */
export type DataEditSticker = {
  name?: string;
  description?: string;
};

/**
 * Call an API route that `client.api` does not know about yet
 */
async function request<T>(
  client: Client,
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const [key, value] = client.authenticationHeader;

  const response = await fetch(`${client.options.baseURL}${path}`, {
    method,
    headers: body
      ? { [key]: value, "Content-Type": "application/json" }
      : { [key]: value },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await response.json().catch(() => ({
      type: "InternalError",
      status: response.status,
    }));
  }

  // DELETE answers with an empty body
  return response.status === 204
    ? (undefined as T)
    : ((await response.json().catch(() => undefined)) as T);
}

/**
 * Fetch a sticker by its id
 *
 * Public route: a sticker travels between servers, so this resolves even when
 * the viewer is not a member of the server it came from.
 */
export function fetchSticker(client: Client, id: string): Promise<APISticker> {
  return request<APISticker>(client, "GET", `/custom/sticker/${id}`);
}

/**
 * List every sticker on a server
 *
 * O `Ready` ja traz as figurinhas de todos os servidores, mas depender so dele
 * significa que qualquer falha na entrega deixa a lista vazia sem nenhum jeito
 * de recuperar. Esta rota da um caminho que nao passa pelo websocket.
 */
export function fetchServerStickers(
  client: Client,
  serverId: string,
): Promise<APISticker[]> {
  return request<APISticker[]>(client, "GET", `/servers/${serverId}/stickers`);
}

/**
 * Create a sticker from an Autumn upload id
 */
export function createSticker(
  client: Client,
  id: string,
  data: DataCreateSticker,
): Promise<APISticker> {
  return request<APISticker>(client, "PUT", `/custom/sticker/${id}`, data);
}

/**
 * Edit a sticker
 */
export function editSticker(
  client: Client,
  id: string,
  data: DataEditSticker,
): Promise<APISticker> {
  return request<APISticker>(client, "PATCH", `/custom/sticker/${id}`, data);
}

/**
 * Delete a sticker
 */
export function deleteSticker(client: Client, id: string): Promise<void> {
  return request<void>(client, "DELETE", `/custom/sticker/${id}`);
}
