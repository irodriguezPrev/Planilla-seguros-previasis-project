export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidVenezuelanMobilePhone(phone: string): boolean {
  const normalizedPhone = normalizePhoneNumber(phone);
  return /^(?:04(?:12|14|16|24|26)\d{7}|584(?:12|14|16|24|26)\d{7})$/.test(normalizedPhone);
}
