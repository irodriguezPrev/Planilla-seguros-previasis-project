import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ObtainClientifyTokenUseCase } from "../../application/clientify/obtain-clientify-token.use-case";
import { ClientifyUnavailableError } from "../../infrastructure/clientify/http-clientify.gateway";

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export class ClientifyController {
  constructor(private readonly obtainToken: ObtainClientifyTokenUseCase) {}

  obtainTokenHandler = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
      return;
    }

    try {
      const clientifyResponse = await this.obtainToken.execute(parsed.data);
      response.status(clientifyResponse.status).json({ data: clientifyResponse.data });
    } catch (error) {
      if (error instanceof ClientifyUnavailableError) {
        response.status(502).json({ message: error.message });
        return;
      }
      next(error);
    }
  };
}
