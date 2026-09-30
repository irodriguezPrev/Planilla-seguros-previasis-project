import { ClientifyCredentials, ClientifyGateway, ClientifyResponse } from "../ports/clientify.gateway";

export class ObtainClientifyTokenUseCase {
  constructor(private readonly clientifyGateway: ClientifyGateway) {}

  execute(credentials: ClientifyCredentials = {}): Promise<ClientifyResponse> {
    return this.clientifyGateway.obtainToken({
      username: credentials.username?.trim(),
      password: credentials.password,
    });
  }
}
