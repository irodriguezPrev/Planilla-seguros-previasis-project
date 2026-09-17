'use client';

import React, { useEffect } from 'react';
import {
  FormaDePagoSection,
  FrecuenciaPago,
  MonedaPago,
  ModalidadPago,
} from '@/core/interfaces/affiliation.interfaces';
import { Calendar, Layers, Repeat, Gift, CreditCard, DollarSign } from 'lucide-react';
import {
  FRECUENCIA_BY_MONEDA,
  MODALIDAD_PAGO_BY_MONEDA,
  labelFrecuenciaPago,
  labelModalidadPago,
} from '@/core/config/payment-options.config';

interface Step5Props {
  pago: FormaDePagoSection;
  onChangePago: (pago: FormaDePagoSection) => void;
}

export const Step5PagoYOtros: React.FC<Step5Props> = ({ pago, onChangePago }) => {
  const frecuenciaIconMap: Record<FrecuenciaPago, React.ElementType> = {
    Mensual: Calendar,
    Trimestral: Layers,
    Semestral: Repeat,
    Anual: Gift,
  };

  const frecuenciasDisponibles = FRECUENCIA_BY_MONEDA[pago.moneda];

  useEffect(() => {
    const validFrecuencias = FRECUENCIA_BY_MONEDA[pago.moneda];
    if (!validFrecuencias.includes(pago.frecuenciaPago)) {
      onChangePago({ ...pago, frecuenciaPago: validFrecuencias[0] });
    }
    const validModalidades = MODALIDAD_PAGO_BY_MONEDA[pago.moneda];
    if (!validModalidades.includes(pago.modalidadPago)) {
      onChangePago({ ...pago, modalidadPago: validModalidades[0], especifiqueOtroPago: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pago.moneda]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* FORMA DE PAGO INTERACTIVA (Cards 2x2 como en la imagen de referencia) */}
      <div className="previasis-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--previasis-green-light)',
              color: 'var(--previasis-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              Frecuencia de Pago
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Seleccione la frecuencia y modalidad de facturación
            </p>
          </div>
        </div>

        {/* Frecuencia de Pago Cards 2x2 */}
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
          {frecuenciasDisponibles.map((frec) => {
            const Icon = frecuenciaIconMap[frec];
            const isSelected = pago.frecuenciaPago === frec;

            return (
              <button
                key={frec}
                type="button"
                onClick={() => onChangePago({ ...pago, frecuenciaPago: frec })}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid',
                  borderColor: isSelected ? 'var(--previasis-green)' : 'var(--border-card)',
                  backgroundColor: isSelected ? 'var(--previasis-green-light)' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: isSelected ? '0 4px 14px var(--previasis-green-glow)' : 'var(--shadow-subtle)',
                }}
              >
                <Icon size={22} color={isSelected ? 'var(--previasis-green)' : 'var(--text-muted)'} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: isSelected ? 'var(--previasis-dark-green)' : 'var(--text-body)',
                  }}
                 >
                  {labelFrecuenciaPago[frec]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Moneda y Modalidad */}
        <div className="grid grid-cols-2 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Moneda de Facturación <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Bolívares', 'Dólares'] as MonedaPago[]).map((mon) => (
                <button
                  key={mon}
                  type="button"
                  onClick={() => onChangePago({ ...pago, moneda: mon })}
                  className={`pill-switch-btn ${pago.moneda === mon ? 'active' : ''}`}
                >
                  {mon}
                </button>
              ))}
            </div>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Modalidad de Cobro <span className="previasis-label-required">*</span>
            </label>
             <select
               className="previasis-input"
               value={pago.modalidadPago}
               onChange={(e) => onChangePago({ ...pago, modalidadPago: e.target.value as ModalidadPago })}
             >
               {MODALIDAD_PAGO_BY_MONEDA[pago.moneda].map((mod) => (
                 <option key={mod} value={mod}>
                   {labelModalidadPago[mod]}
                 </option>
               ))}
             </select>
          </div>
        </div>

        {pago.modalidadPago === 'Otro' && (
          <div className="previasis-input-group" style={{ marginTop: '1rem' }}>
            <label className="previasis-label">
              Especifique Otra Modalidad de Pago <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ej: Transferencia bancaria directa / Pago Móvil"
              value={pago.especifiqueOtroPago || ''}
              onChange={(e) => onChangePago({ ...pago, especifiqueOtroPago: e.target.value })}
              required
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5PagoYOtros;
