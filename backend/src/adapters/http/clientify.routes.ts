import { Router } from "express";
import { ClientifyController } from "./clientify.controller";

export function createClientifyRouter(controller: ClientifyController): Router {
  const router = Router();
  router.post("/token", controller.obtainTokenHandler);
  return router;
}
