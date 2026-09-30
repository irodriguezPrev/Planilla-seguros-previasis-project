import { timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrepareDemoSellerUseCase } from "../../application/signing/signing.use-cases";
import { demoAuthConfig } from "../../config/demo-auth.config";
import { signingConfig } from "../../config/signing.config";

const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

const safeEqual = (candidate: string, expected: string): boolean => {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer);
};

const demoUser = () => ({
  user_id: demoAuthConfig.userId,
  name: demoAuthConfig.name,
  status: true,
  role: "vendedor",
  ci: demoAuthConfig.document,
  email: demoAuthConfig.email,
});

export class DemoAuthController {
  constructor(private readonly prepareSeller: PrepareDemoSellerUseCase) {}

  login = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!demoAuthConfig.enabled) {
      response.status(404).json({
        message: "El acceso demostrativo no está habilitado.",
      });
      return;
    }
    if (!demoAuthConfig.password || !signingConfig.jwtSecret) {
      response.status(503).json({
        message: "Configure DEMO_SELLER_PASSWORD y PRIVATE_KEY en el backend.",
      });
      return;
    }

    const parsed = loginSchema.safeParse(request.body);
    if (
      !parsed.success ||
      !safeEqual(parsed.data.name, demoAuthConfig.username) ||
      !safeEqual(parsed.data.password, demoAuthConfig.password)
    ) {
      response.status(401).json({ message: "Usuario o contraseña incorrectos." });
      return;
    }

    try {
      await this.prepareSeller.execute();
      const token = jwt.sign(
        {
          user_id: demoAuthConfig.userExternalId,
          role: "vendedor",
          name: demoAuthConfig.name,
        },
        signingConfig.jwtSecret,
        { expiresIn: "8h" },
      );
      response.json({
        message: "Sesión de demostración iniciada.",
        data: { token, user: demoUser() },
      });
    } catch (error) {
      next(error);
    }
  };

  me = (request: Request, response: Response): void => {
    if (!demoAuthConfig.enabled) {
      response.status(404).json({
        message: "El acceso demostrativo no está habilitado.",
      });
      return;
    }
    if (!signingConfig.jwtSecret) {
      response.status(503).json({
        message: "La autenticación no está configurada.",
      });
      return;
    }

    const authorization = request.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      response.status(401).json({ message: "Token requerido." });
      return;
    }

    try {
      const payload = jwt.verify(
        authorization.slice(7),
        signingConfig.jwtSecret,
      );
      const userId = typeof payload === "string" ? undefined : payload.user_id;
      if (String(userId ?? "") !== demoAuthConfig.userExternalId) {
        response.status(401).json({ message: "Token inválido." });
        return;
      }
      response.json({ message: "Sesión válida.", data: demoUser() });
    } catch {
      response.status(401).json({ message: "Token inválido o expirado." });
    }
  };
}
