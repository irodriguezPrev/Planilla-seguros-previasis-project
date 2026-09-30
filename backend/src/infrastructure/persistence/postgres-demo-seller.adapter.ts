import type { DemoSellerRepository } from "../../application/ports/demo-seller.repository";
import { ensureDemoSellerProfile } from "./postgres-demo-seller.repository";

export class PostgresDemoSellerRepository implements DemoSellerRepository {
  ensureProfile() {
    return ensureDemoSellerProfile();
  }
}
