export interface SellerAuthenticator {
  authenticate(authorization: string | undefined): string;
}
