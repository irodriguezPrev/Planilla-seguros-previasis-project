export const demoAuthConfig = {
  enabled: process.env.DEMO_SELLER_ENABLED === "true" && process.env.NODE_ENV !== "production",
  username: process.env.DEMO_SELLER_USERNAME ?? "demo-vendedor",
  password: process.env.DEMO_SELLER_PASSWORD ?? "",
  userId: 900001,
  userExternalId: "900001",
  name: "Vendedor de demostración",
  email: "demo-vendedor@previasis.local",
  document: "90000101",
  credentialNumber: "DEMO-900001",
}
