import type { QuoteRateInfo } from '../interfaces';
import { BCV_RATE_MAX, BCV_RATE_MIN } from '../config/bcv-rate.config';
import { USD_BCV_FALLBACK_RATE } from '../config/currency.config';

/**
 * Extrae la tasa informativa del Banco Central de Venezuela desde su HTML.
 *
 * El marcado relevante es:
 *
 * ```html
 * <div id="dolar" class="col-sm-12 ...">
 *   <div class="field-content">
 *     <div class="row recuadrotsmc">
 *       <div class="col-sm-6 ..."><span> USD</span></div>
 *       <div class="col-sm-6 ..."><strong class="strong-tb">872,39270000</strong></div>
 *     </div>
 *   </div>
 * </div>
 * <div class="pull-right dinpro center">
 *   Fecha Valor: <span class="date-display-single"
 *                      content="2026-10-06T00:00:00-04:00">Martes, 06 Octubre 2026</span>
 * </div>
 * ```
 *
 * Tres detalles condicionan el diseño:
 *
 * 1. El separador decimal es la coma, así que `872,39270000` es `872.3927`.
 * 2. "Fecha Valor:" está FUERA del `div#dolar`, por lo que la ventana tiene que
 *    continuar más allá de su cierre.
 * 3. La fecha localizada es frágil de parsear; se prefiere el atributo
 *    `content`, que trae un ISO `YYYY-MM-DD` independiente del idioma.
 *
 * Devuelve `null` si el marcado cambió o la tasa queda fuera del rango de
 * sanidad: nunca se devuelve un número que no se pueda justificar.
 */
const WINDOW = 3000;

export function parseBcvRate(html: string): QuoteRateInfo | null {
  if (typeof html !== 'string' || html.length === 0) return null;

  const anchor = html.indexOf('id="dolar"');
  if (anchor === -1) return null;

  const window = html.slice(anchor, anchor + WINDOW);
  const text = window
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    // Un <style> sin cerrar dentro de la ventana dejaría CSS suelto en el
    // texto aplanado; lo que queda desde ahí no es contenido de interés.
    .replace(/<style[\s\S]*$/i, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const rateMatch = text.match(/USD\s*([0-9]{1,5}(?:[.,][0-9]{1,8})?)/);
  if (!rateMatch) return null;

  const rate = Number.parseFloat(rateMatch[1].replace(',', '.'));
  if (!Number.isFinite(rate) || rate < BCV_RATE_MIN || rate > BCV_RATE_MAX) return null;

  return { rate, date: extractValueDate(window, text), source: 'BCV' };
}

/**
 * Fecha de valor publicada por el BCV, normalizada a `YYYY-MM-DD`.
 *
 * Primero intenta el ISO del atributo `content`. Si no está, reconstruye la
 * fecha desde la etiqueta localizada ("Martes, 06 Octubre 2026"), que trae el
 * mes como palabra — de ahí la tabla de meses es/en. Cualquier fallo devuelve
 * `''`: la fecha es informativa y no justifica descartar una tasa válida.
 */
function extractValueDate(rawWindow: string, flattenedText: string): string {
  const iso = rawWindow.match(/Fecha\s*Valor:[\s\S]{0,400}?content="(\d{4}-\d{2}-\d{2})/i);
  if (iso) return iso[1];

  const label = flattenedText.match(/Fecha\s*Valor:\s*(.+?)(?:\s+Tasas|\s*$)/i);
  return label ? dateFromLabel(label[1]) : '';
}

/** Meses nombrados en español y en inglés. Clave en minúsculas. */
const MONTH_BY_NAME: Record<string, string> = {
  enero: '01', january: '01',
  febrero: '02', february: '02',
  marzo: '03', march: '03',
  abril: '04', april: '04',
  mayo: '05', may: '05',
  junio: '06', june: '06',
  julio: '07', july: '07',
  agosto: '08', august: '08',
  septiembre: '09', september: '09', setiembre: '09',
  octubre: '10', october: '10',
  noviembre: '11', november: '11',
  diciembre: '12', december: '12',
};

/**
 * Reconstruye `YYYY-MM-DD` desde una fecha legible.
 *
 * El día es el primer número corto y el año el de cuatro cifras; no se toma
 * "el primer número" a ciegas porque el año (2026) también es numérico.
 */
function dateFromLabel(value: string): string {
  const numbers = value.match(/\b\d{1,4}\b/g) ?? [];
  const lower = value.toLowerCase();
  const monthName = Object.keys(MONTH_BY_NAME).find((name) => lower.includes(name));

  // Se separan año y día por longitud en vez de por posición: la etiqueta
  // puede ordenarlos como "06 Octubre 2026" o como "2026-10-06".
  const year = numbers.find((n) => n.length === 4 && /^(19|20)/.test(n));
  const day = numbers.find((n) => n !== year);

  if (!year || !day || !monthName) return '';

  const dayNumber = Number(day);
  if (dayNumber < 1 || dayNumber > 31) return '';

  return `${year}-${MONTH_BY_NAME[monthName]}-${String(dayNumber).padStart(2, '0')}`;
}

/** Tasa de respaldo configurada, o `null` si no existe. */
export function getFallbackRate(): QuoteRateInfo | null {
  if (USD_BCV_FALLBACK_RATE === null) return null;
  return { rate: USD_BCV_FALLBACK_RATE, date: '', source: 'fallback' };
}
