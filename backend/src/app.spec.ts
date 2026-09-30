import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HTTP API", () => {
  it("returns health status", async () => {
    const response = await request(createApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("creates and lists users", async () => {
    const app = createApp();
    const createResponse = await request(app)
      .post("/api/users")
      .send({ name: "Grace Hopper", email: "grace@example.com" });
    const listResponse = await request(app).get("/api/users");

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.email).toBe("grace@example.com");
    expect(listResponse.body.data).toHaveLength(1);
  });

  it("validates the request body", async () => {
    const response = await request(createApp())
      .post("/api/users")
      .send({ name: "", email: "invalid" });
    expect(response.status).toBe(400);
  });

  it("requests a token from Clientify", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "clientify-token" }), { status: 200 })
    );
    const response = await request(createApp())
      .post("/api/clientify/token")
      .send({ username: "clientify-user", password: "secret" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { token: "clientify-token" } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.clientify.net/v1/api-auth/obtain_token/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "clientify-user", password: "secret" }),
      })
    );
  });

  it("validates Clientify credentials", async () => {
    const response = await request(createApp())
      .post("/api/clientify/token")
      .send({ username: "" });
    expect(response.status).toBe(400);
  });
});
