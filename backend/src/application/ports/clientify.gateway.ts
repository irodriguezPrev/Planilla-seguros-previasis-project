export interface ClientifyCredentials {
  username?: string;
  password?: string;
}

export interface ClientifyResponse {
  status: number;
  data: unknown;
}

export interface ClientifyGateway {
  obtainToken(credentials?: ClientifyCredentials): Promise<ClientifyResponse>;
  logIn?(credentials?: ClientifyCredentials): Promise<ClientifyResponse>;
}
