import { Router } from "express";
import { SigningController } from "./signing.controller";

export function createSigningRouter(controller: SigningController): Router {
  const router = Router();
  router.post("/", controller.create);
  router.post("/:token/access", controller.access);
  router.post("/:token/sign", controller.sign);
  return router;
}

export function createReferralRouter(controller: SigningController): Router {
  const router = Router();
  router.get("/me", controller.myReferral);
  router.get("/:code", controller.referralProfile);
  return router;
}
