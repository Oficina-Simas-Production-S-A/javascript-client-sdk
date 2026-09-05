import type { Client } from "../Client.js";

/**
 * Soundboard types and requests.
 *
 * These live here rather than coming from `stoat-api` because that package is
 * generated from the published OpenAPI spec: until a release carries the
 * soundboard routes, `client.api` cannot express them and would not type check.
 * Everything below mirrors `crates/core/models/src/v0/soundboard.rs`.
 */

/** What owns a sound */
export type SoundParent = { type: "Server"; id: string } | { type: "Detached" };

/** Sound as the API returns it */
export type APISound = {
  _id: string;
  parent: SoundParent;
  creator_id: string;
  name: string;
  emoji?: string;
};

/** Body for creating a sound */
export type DataCreateSound = {
  name: string;
  parent: SoundParent;
  emoji?: string;
};

/** Body for editing a sound */
export type DataEditSound = {
  name?: string;
  emoji?: string;
  remove?: "Emoji"[];
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
 * Fetch a sound by its id
 */
export function fetchSound(client: Client, id: string): Promise<APISound> {
  return request<APISound>(client, "GET", `/custom/sound/${id}`);
}

/**
 * List every sound on a server
 *
 * O `Ready` ja traz os sons de todos os servidores, mas depender so dele
 * significa que qualquer falha na entrega deixa a lista vazia sem nenhum jeito
 * de recuperar. Esta rota da um caminho que nao passa pelo websocket.
 */
export function fetchServerSounds(
  client: Client,
  serverId: string,
): Promise<APISound[]> {
  return request<APISound[]>(client, "GET", `/servers/${serverId}/sounds`);
}

/**
 * Create a sound from an Autumn upload id
 */
export function createSound(
  client: Client,
  id: string,
  data: DataCreateSound,
): Promise<APISound> {
  return request<APISound>(client, "PUT", `/custom/sound/${id}`, data);
}

/**
 * Edit a sound
 */
export function editSound(
  client: Client,
  id: string,
  data: DataEditSound,
): Promise<APISound> {
  return request<APISound>(client, "PATCH", `/custom/sound/${id}`, data);
}

/**
 * Delete a sound
 */
export function deleteSound(client: Client, id: string): Promise<void> {
  return request<void>(client, "DELETE", `/custom/sound/${id}`);
}
