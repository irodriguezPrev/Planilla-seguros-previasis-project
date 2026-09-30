import { ClientifyCredentials, ClientifyGateway, ClientifyResponse } from "../../application/ports/clientify.gateway";

const DEFAULT_CLIENTIFY_LOGIN_URL =
  "https://api.clientify.net/v1/api-auth/obtain_token/";

export class ClientifyUnavailableError extends Error {
  constructor(message: string = "Clientify is not reachable") {
    super(message);
    this.name = "ClientifyUnavailableError";
  }
}

export class HttpClientifyGateway implements ClientifyGateway {
  private tokenUrl: string;
  private timeoutMs: number;

  constructor(
    tokenUrl: string = process.env.CLIENTIFY_URL_LOGIN ?? DEFAULT_CLIENTIFY_LOGIN_URL,
    timeoutMs: number = Number(process.env.CLIENTIFY_TIMEOUT_MS ?? 10_000)
  ) {
    this.tokenUrl = tokenUrl;
    this.timeoutMs = timeoutMs;
  }

  async obtainToken(credentials?: ClientifyCredentials): Promise<ClientifyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials ?? {}),
        signal: controller.signal,
      });
      const data = await response.json();
      return { status: response.status, data };
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError"
        ? "Clientify request timed out"
        : "Clientify is not reachable";
      throw new ClientifyUnavailableError(message);
    } finally {
      clearTimeout(timeout);
    }
  }

  async logIn(credentials?: ClientifyCredentials): Promise<ClientifyResponse> {
    return this.obtainToken(credentials);
  }
}
