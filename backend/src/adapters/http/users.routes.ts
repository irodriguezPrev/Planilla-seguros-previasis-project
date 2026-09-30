import { Router } from "express";
import { UsersController } from "./users.controller";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.post("/", controller.create);
  return router;
}
