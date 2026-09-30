import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import { createClientifyRouter } from "./adapters/http/clientify.routes";
import { createDemoAuthRouter } from "./adapters/http/demo-auth.routes";
import { errorMiddleware } from "./adapters/http/error.middleware";
import {
  createReferralRouter,
  createSigningRouter,
} from "./adapters/http/signing.routes";
import { createUsersRouter } from "./adapters/http/users.routes";
import { createContainer } from "./config/container";

export function createApp(): Express {
  const app = express();
  const {
    usersController,
    clientifyController,
    signingController,
    demoAuthController,
  } = createContainer();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json({ limit: "5mb" }));

  const health = (_request: express.Request, response: express.Response) => {
    response.status(200).json({ status: "ok" });
  };
  app.get("/health", health);
  app.get("/api/health", health);
  app.get("/health/database", signingController.databaseHealth);
  app.get("/api/health/database", signingController.databaseHealth);

  app.use("/api/users", createUsersRouter(usersController));
  app.use("/api/clientify", createClientifyRouter(clientifyController));
  app.use("/api/credential", createDemoAuthRouter(demoAuthController));
  app.use("/api/signing-requests", createSigningRouter(signingController));
  app.use("/api/referrals", createReferralRouter(signingController));
  app.use(errorMiddleware);

  return app;
}
