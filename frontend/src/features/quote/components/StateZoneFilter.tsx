'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

import { VENEZUELA_STATES } from '@/core/config/venezuela-locations.config';
import { ZoneReadonly } from './ZoneReadonly';
import type { StateZoneFilterProps } from './components.interfaces';

/**
 * Filtro de la página de planes: solo el estado.
 *
 * Es el mismo par estado → zona que usa el cotizador, con la zona en
 * solo lectura, así los precios "desde" del catálogo corresponden a la zona
 * que después aplicará la cotización.
 */
export const StateZoneFilter: React.FC<StateZoneFilterProps> = ({
  stateName,
  onStateChange,
  zone,
  zoneUnmapped,
}) => {
  const t = useTranslations('quote');

  return (
    <section className="previasis-card q-filter" aria-label={t('form.zoneLabel')}>
      <div className="q-filter-head">
        <span className="q-filter-icon" aria-hidden="true">
          <MapPin size={15} />
        </span>
        <div>
          <h2 className="q-filter-title">{t('form.zoneLabel')}</h2>
          <p className="q-filter-hint">{t('form.zoneNote')}</p>
        </div>
      </div>

      <div className="q-filter-grid">
        <div>
          <label className="q-field-label" htmlFor="q-filter-state">
            {t('form.stateLabel')}
          </label>
          <select
            id="q-filter-state"
            className="q-select"
            value={stateName}
            onChange={(event) => onStateChange(event.target.value)}
            style={{ marginTop: '0.375rem' }}
          >
            <option value="">{t('form.statePlaceholder')}</option>
            {VENEZUELA_STATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* La nota de zona ya está en el encabezado: solo se añade la del
            estado sin mapear, que es la única novedad. */}
        <ZoneReadonly zone={zone} zoneUnmapped={zoneUnmapped} showNote={false} />
      </div>

      {zoneUnmapped && (
        <p className="q-field-note" style={{ marginTop: '0.75rem' }}>
          {t('form.zoneUnmapped')}
        </p>
      )}
    </section>
  );
};

StateZoneFilter.displayName = 'StateZoneFilter';

export default StateZoneFilter;
