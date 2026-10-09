import type { AgeRange, PlanName } from '@/core/config/tariff-data';
import type { Zone } from '@/core/config/zone-config';

import type {
  CoverageTier,
  QuoteCurrency,
  QuotePlanInfo,
  QuoteRateInfo,
  QuoteResult,
} from '../interfaces';

/**
 * Props de los componentes del cotizador.
 *
 * Agrupadas aquí para que cada componente declare solo su componente y no
 * mezcle el contrato de datos con la implementación: un cambio de fila no
 * obliga a reabrir la definición de la interfaz.
 */

export interface QuoteFormProps {
  ageInput: string;
  onAgeChange: (value: string) => void;
  ageError: boolean;
  stateName: string;
  onStateChange: (value: string) => void;
  zone: Zone | null;
  zoneUnmapped: boolean;
  ageRange: AgeRange | null;
  plans: QuotePlanInfo[];
  effectivePlan: PlanName | null;
  onPlanChange: (value: PlanName) => void;
  coverages: number[];
  coverage: number | null;
  onCoverageChange: (value: number) => void;
  canCalculate: boolean;
  onCalculate: () => void;
  hasResult: boolean;
  stale: boolean;
}

export interface QuoteCatalogProps {
  plans: QuotePlanInfo[];
  zone: Zone | null;
}

export interface QuoteRailProps {
  result: QuoteResult | null;
  age: number | null;
  stateName: string;
  zone: Zone | null;
  /** `null` mientras no haya cotización válida: el CTA queda deshabilitado. */
  ctaHref: string | null;
  onCtaClick: () => void;
}

export interface QuoteResultsProps {
  result: QuoteResult | null;
  currency: QuoteCurrency;
  onCurrencyChange: (value: QuoteCurrency) => void;
  rate: QuoteRateInfo | null;
  rateStatus: 'loading' | 'ready' | 'error';
}

export interface ZoneReadonlyProps {
  zone: Zone | null;
  zoneUnmapped: boolean;
  /**
   * La nota inferior explica que la zona sale del estado. Se apaga cuando el
   * contenedor ya da esa explicación, para no repetirla dos veces seguidas.
   */
  showNote?: boolean;
}

export interface StateZoneFilterProps {
  stateName: string;
  onStateChange: (value: string) => void;
  zone: Zone | null;
  zoneUnmapped: boolean;
}