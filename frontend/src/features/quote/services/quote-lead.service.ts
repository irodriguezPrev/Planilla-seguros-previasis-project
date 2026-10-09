/**
 * Punto de extensión para capturar un lead de cotización.
 *
 * No existe endpoint de leads en el backend, así que por ahora la llamada es
 * un `console.info` local y la acción real es redirigir al formulario de
 * afiliación. Cuando el backend exponga algo como `POST /quote-lead`, basta
 * con sustituir el cuerpo de esta función: ningún componente cambia.
 */

export interface QuoteLeadPayload {
  requestedPlan: string;
  coverageLimit: number;
  birthDate: string;
  age: number;
  state: string;
  zone: string;
  currency: string;
  term: string;
  amount: number;
}

export async function sendQuoteLead(payload: QuoteLeadPayload): Promise<void> {
  // TODO(backend): enviar a `POST ${API_ENDPOINTS.QUOTE_LEADS}` cuando exista.
  if (process.env.NODE_ENV !== 'production') {
    console.info('[quote] lead capturado', payload);
  }
}
