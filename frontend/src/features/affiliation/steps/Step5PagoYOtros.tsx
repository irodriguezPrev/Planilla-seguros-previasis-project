'use client';

import React from 'react';
import {
  FormaDePagoSection,
  FrecuenciaPago,
  MonedaPago,
  ModalidadPago,
} from '@/core/interfaces/affiliation.interfaces';
import { Calendar, Layers, Repeat, Gift, CreditCard, DollarSign } from 'lucide-react';

interface Step5Props {
  pago: FormaDePagoSection;
  onChangePago: (pago: FormaDePagoSection) => void;
}

export const Step5PagoYOtros: React.FC<Step5Props> = ({ pago, onChangePago }) => {
  const updateOtrosContratos = (fields: Partial<typeof pago.otrosContratos>) => {
    onChangePago({
      ...pago,
      otrosContratos: { ...pago.otrosContratos, ...fields },
    });
  };

  const updateNegativa = (fields: Partial<typeof pago.negativaPrevia>) => {
    onChangePago({
      ...pago,
      negativaPrevia: { ...pago.negativaPrevia, ...fields },
    });
  };

  const frecuencias: { id: FrecuenciaPago; label: string; icon: any }[] = [
    { id: 'Mensual', label: 'Mensual', icon: Calendar },
    { id: 'Trimestral', label: 'Trimestral', icon: Layers },
    { id: 'Semestral', label: 'Semestral', icon: Repeat },
    { id: 'Anual', label: 'Anual', icon: Gift },
  ];

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
              Forma de Pago
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Seleccione la frecuencia y modalidad de facturación
            </p>
          </div>
        </div>

        {/* Frecuencia de Pago Cards 2x2 */}
        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
          {frecuencias.map((frec) => {
            const Icon = frec.icon;
            const isSelected = pago.frecuenciaPago === frec.id;

            return (
              <button
                key={frec.id}
                type="button"
                onClick={() => onChangePago({ ...pago, frecuenciaPago: frec.id })}
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
                  {frec.label}
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
              <option value="Domiciliación de Pago">Domiciliación Bancaria / Cargo Automático</option>
              <option value="Pago en Oficina">Pago Directo en Oficina Previasis</option>
              <option value="Otro">Otro (Transferencia / Zelle / Pago Móvil)</option>
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

      {/* OTROS CONTRATOS Y NEGATIVAS */}
      <div className="previasis-card">
        <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--previasis-dark-green)', marginBottom: '1rem' }}>
          Antecedentes de Contratos y Seguros
        </h4>

        {/* Otros Contratos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="previasis-label" style={{ maxWidth: '70%' }}>
              ¿Mantiene usted o algún familiar contrato de salud vigente con otra compañía?
            </label>
            <div className="pill-switch">
              <button
                type="button"
                onClick={() => updateOtrosContratos({ tiene: 'NO' })}
                className={`pill-switch-btn ${pago.otrosContratos.tiene === 'NO' ? 'active' : ''}`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => updateOtrosContratos({ tiene: 'SÍ' })}
                className={`pill-switch-btn ${pago.otrosContratos.tiene === 'SÍ' ? 'active' : ''}`}
              >
                SÍ
              </button>
            </div>
          </div>

          {pago.otrosContratos.tiene === 'SÍ' && (
            <div className="grid grid-cols-2 gap-4" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
              <div className="previasis-input-group">
                <label className="previasis-label">Nº de Contrato</label>
                <input
                  type="text"
                  className="previasis-input"
                  value={pago.otrosContratos.numContrato || ''}
                  onChange={(e) => updateOtrosContratos({ numContrato: e.target.value })}
                />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Nombre de la Compañía</label>
                <input
                  type="text"
                  className="previasis-input"
                  value={pago.otrosContratos.nombreCompania || ''}
                  onChange={(e) => updateOtrosContratos({ nombreCompania: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Negativas Previas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="previasis-label" style={{ maxWidth: '70%' }}>
              ¿En alguna oportunidad le ha sido negado o anulado un contrato de salud?
            </label>
            <div className="pill-switch">
              <button
                type="button"
                onClick={() => updateNegativa({ tiene: 'NO' })}
                className={`pill-switch-btn ${pago.negativaPrevia.tiene === 'NO' ? 'active' : ''}`}
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => updateNegativa({ tiene: 'SÍ' })}
                className={`pill-switch-btn ${pago.negativaPrevia.tiene === 'SÍ' ? 'active' : ''}`}
              >
                SÍ
              </button>
            </div>
          </div>

          {pago.negativaPrevia.tiene === 'SÍ' && (
            <div className="grid grid-cols-2 gap-4" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
              <div className="previasis-input-group">
                <label className="previasis-label">Tipo de Seguro</label>
                <input
                  type="text"
                  className="previasis-input"
                  value={pago.negativaPrevia.tipoSeguro || ''}
                  onChange={(e) => updateNegativa({ tipoSeguro: e.target.value })}
                />
              </div>
              <div className="previasis-input-group">
                <label className="previasis-label">Compañía que Rechazó</label>
                <input
                  type="text"
                  className="previasis-input"
                  value={pago.negativaPrevia.nombreCompania || ''}
                  onChange={(e) => updateNegativa({ nombreCompania: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step5PagoYOtros;
