import { ClientifyController } from "../adapters/http/clientify.controller";
import { DemoAuthController } from "../adapters/http/demo-auth.controller";
import { SigningController } from "../adapters/http/signing.controller";
import { UsersController } from "../adapters/http/users.controller";
import { ObtainClientifyTokenUseCase } from "../application/clientify/obtain-clientify-token.use-case";
import {
  AccessSigningRequestUseCase,
  CheckSigningDatabaseUseCase,
  CreateSigningRequestUseCase,
  GetReferralProfileUseCase,
  GetSellerReferralUseCase,
  PrepareDemoSellerUseCase,
  SignDocumentUseCase,
} from "../application/signing/signing.use-cases";
import { CreateUserUseCase } from "../application/users/create-user.use-case";
import { ListUsersUseCase } from "../application/users/list-users.use-case";
import { HttpClientifyGateway } from "../infrastructure/clientify/http-clientify.gateway";
import { InMemoryUserRepository } from "../infrastructure/persistence/in-memory-user.repository";
import { PostgresDemoSellerRepository } from "../infrastructure/persistence/postgres-demo-seller.adapter";
import { PostgresSigningRepository } from "../infrastructure/persistence/postgres-signing.adapter";
import { JwtSellerAuthenticator } from "../infrastructure/security/jwt-seller-authenticator";

export function createContainer() {
  const userRepository = new InMemoryUserRepository();
  const createUser = new CreateUserUseCase(userRepository);
  const listUsers = new ListUsersUseCase(userRepository);
  const usersController = new UsersController(createUser, listUsers);

  const clientifyGateway = new HttpClientifyGateway();
  const obtainClientifyToken = new ObtainClientifyTokenUseCase(clientifyGateway);
  const clientifyController = new ClientifyController(obtainClientifyToken);

  const signingRepository = new PostgresSigningRepository();
  const sellerAuthenticator = new JwtSellerAuthenticator();
  const signingController = new SigningController({
    sellerAuthenticator,
    createSigningRequest: new CreateSigningRequestUseCase(signingRepository),
    accessSigningRequest: new AccessSigningRequestUseCase(signingRepository),
    signDocument: new SignDocumentUseCase(signingRepository),
    getSellerReferral: new GetSellerReferralUseCase(signingRepository),
    getReferralProfile: new GetReferralProfileUseCase(signingRepository),
    checkDatabase: new CheckSigningDatabaseUseCase(signingRepository),
  });

  const demoSellerRepository = new PostgresDemoSellerRepository();
  const demoAuthController = new DemoAuthController(
    new PrepareDemoSellerUseCase(demoSellerRepository),
  );

  return {
    usersController,
    clientifyController,
    signingController,
    demoAuthController,
  };
}
