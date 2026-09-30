import { describe, expect, it, vi } from "vitest";
import { ObtainClientifyTokenUseCase } from "./obtain-clientify-token.use-case";

describe("ObtainClientifyTokenUseCase", () => {
  it("delegates credentials to the Clientify gateway", async () => {
    const gateway = {
      obtainToken: vi.fn().mockResolvedValue({ status: 200, data: { token: "clientify-token" } }),
    };
    const useCase = new ObtainClientifyTokenUseCase(gateway);
    const result = await useCase.execute({ username: " user ", password: "secret" });
    expect(result).toEqual({ status: 200, data: { token: "clientify-token" } });
    expect(gateway.obtainToken).toHaveBeenCalledWith({ username: "user", password: "secret" });
  });
});
