'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

import type { ZoneReadonlyProps } from './components.interfaces';

/**
 * Informa la zona tarifaria sin ofrecer ningún control: la zona no se elige,
 * se deduce de la tabla `ZONE_MAPPING` a partir del estado.
 *
 * Compartida por el cotizador (`QuoteForm`) y por el filtro de la página de
 * planes (`StateZoneFilter`) para que ambas páginas cuenten la misma historia.
 */
export const ZoneReadonly: React.FC<ZoneReadonlyProps> = ({
  zone,
  zoneUnmapped,
  showNote = true,
}) => {
  const t = useTranslations('quote');

  return (
    <div>
      <p className="q-field-label" id="q-zone-label">
        {t('form.zoneLabel')}
      </p>
      <div
        className="q-zone-readonly"
        role="status"
        aria-live="polite"
        aria-labelledby="q-zone-label"
      >
        <span className="q-zone-value">{zone ?? '—'}</span>
        <span className="q-zone-auto">{t('form.zoneAuto')}</span>
      </div>
      {showNote && (
        <p className="q-field-note" style={{ marginTop: '0.375rem' }}>
          {zoneUnmapped ? t('form.zoneUnmapped') : t('form.zoneNote')}
        </p>
      )}
    </div>
  );
};

ZoneReadonly.displayName = 'ZoneReadonly';

export default ZoneReadonly;
