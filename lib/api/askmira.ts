import apiClient from "./client";

/** This workspace's connection to an AskMiraa workspace (routes/askmira.js on the backend). */
export interface AskmiraConnection {
  tenant: string;
  connected: boolean;
  /** The AskMiraa workspace this one is connected to, as it called itself. */
  askmira_workspace: string | null;
  askmira_origin: string | null;
  connected_at: string | null;
}

/** What AskMiraa sent with its connect request (the /connect/askmira query string). */
export interface AskmiraConnectRequest {
  tenant_id: string;
  tenant_name: string;
  redirect_uri: string;
  state: string;
  challenge: string;
}

export async function getAskmiraConnection(): Promise<AskmiraConnection> {
  const { data } = await apiClient.get<AskmiraConnection>("/askmira-connection");
  return data;
}

/** Allow: a one-time code for AskMiraa, bound to this workspace. Returns where to send the browser. */
export async function approveAskmira(request: AskmiraConnectRequest): Promise<string> {
  const { data } = await apiClient.post<{ redirect_to: string }>("/askmira-connection/approve", request);
  return data.redirect_to;
}

export async function disconnectAskmira(): Promise<AskmiraConnection> {
  const { data } = await apiClient.delete<AskmiraConnection>("/askmira-connection");
  return data;
}
