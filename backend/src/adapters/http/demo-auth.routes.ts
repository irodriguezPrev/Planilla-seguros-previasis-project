import { Router } from "express";
import { DemoAuthController } from "./demo-auth.controller";

export function createDemoAuthRouter(controller: DemoAuthController): Router {
  const router = Router();
  router.post("/login", controller.login);
  router.get("/me", controller.me);
  return router;
}
