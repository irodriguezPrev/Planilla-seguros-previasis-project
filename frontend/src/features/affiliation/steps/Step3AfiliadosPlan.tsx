'use client';

import React, { useRef, useState } from 'react';
import {
  AfiliadoRow,
  FrecuenciaPago,
  PlanSolicitado,
  Parentesco,
  TipoDocumento,
} from '@/core/interfaces/affiliation.interfaces';
import { calculateActuarialAge as calculateAge } from '@/core/utils/age.utils';
import { UserPlus, Trash2, Users, Award, Check, Calculator, Flame } from 'lucide-react';

type PricingStyle = 'cards' | 'segmented' | 'compact';

const billingPeriods: Array<{
  id: FrecuenciaPago;
  shortLabel: string;
  months: number;
}> = [
  { id: 'Mensual', shortLabel: '1 mes', months: 1 },
  { id: 'Trimestral', shortLabel: '3 meses', months: 3 },
  { id: 'Semestral', shortLabel: '6 meses', months: 6 },
  { id: 'Anual', shortLabel: '12 meses', months: 12 },
];

type PlanOption = {
  id: PlanSolicitado;
  name: string;
  classStyle: string;
  features: string[];
  defaultCoverage: string;
  monthlyPrices: Partial<Record<'0-20' | '21-40' | '41-60' | '61-80', number>>;
};

const planOptions: PlanOption[] = [
  {
    id: 'Plan Bronce',
    name: 'Plan Bronce',
    classStyle: 'plan-bronce',
    features: ['Consulta general', 'Farmacia básica', 'Emergencias 24/7'],
    defaultCoverage: '$10.000',
    monthlyPrices: { '0-20': 15, '21-40': 18, '41-60': 21 },
  },
  {
    id: 'Plan Plata',
    name: 'Plan Plata',
    classStyle: 'plan-plata',
    features: ['Especialistas', 'Hospitalización', 'Cirugías electivas'],
    defaultCoverage: '$15.000',
    monthlyPrices: { '0-20': 18, '21-40': 21, '41-60': 25 },
  },
  {
    id: 'Plan Oro',
    name: 'Plan Oro',
    classStyle: 'plan-oro',
    features: ['Cobertura total', 'Atención VIP', 'Red de clínicas premium'],
    defaultCoverage: '$25.000',
    monthlyPrices: { '0-20': 27, '21-40': 32, '41-60': 37 },
  },
  {
    id: 'Plan Diamante',
    name: 'Plan Diamante',
    classStyle: 'plan-diamante',
    features: ['Cobertura superior', 'Atención preferencial', 'Red de clínicas premium'],
    defaultCoverage: '$40.000',
    monthlyPrices: { '0-20': 36, '21-40': 42, '41-60': 50 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Bronce',
    classStyle: 'plan-bronce',
    features: ['Personas de 61 a 80 años', 'Telemedicina 24 horas', 'Atención domiciliaria'],
    defaultCoverage: '$3.000',
    monthlyPrices: { '61-80': 35 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Plata',
    classStyle: 'plan-plata',
    features: ['Personas de 61 a 80 años', 'Cobertura ampliada', 'Atención domiciliaria'],
    defaultCoverage: '$5.000',
    monthlyPrices: { '61-80': 50 },
  },
  {
    id: 'Abuelos',
    name: 'Plan Abuelos - Oro',
    classStyle: 'plan-oro',
    features: ['Personas de 61 a 80 años', 'Cobertura máxima', 'Atención domiciliaria'],
    defaultCoverage: '$10.000',
    monthlyPrices: { '61-80': 70 },
  },
];

function getMinimumBirthDate(): string {
  const maximumDate = new Date();
  maximumDate.setFullYear(maximumDate.getFullYear() - 80);
  const month = String(maximumDate.getMonth() + 1).padStart(2, '0');
  const day = String(maximumDate.getDate()).padStart(2, '0');
  return `${maximumDate.getFullYear()}-${month}-${day}`;
}

function getAgeRange(age: number | null): '0-20' | '21-40' | '41-60' | '61-80' | null {
  if (age === null || age < 0) return null;
  if (age <= 20) return '0-20';
  if (age <= 40) return '21-40';
  if (age <= 60) return '41-60';
  if (age <= 80) return '61-80';
  return null;
}

function getMonthlyPrice(plan: PlanOption | undefined, age: number | null): number | null {
  const range = getAgeRange(age);
  return range && plan?.monthlyPrices[range] !== undefined
    ? plan.monthlyPrices[range] ?? null
    : null;
}

// Obtiene la cuota sin impuestos de un beneficiario según su plan y edad actuarial
function getAfiliadoCuota(afiliado: AfiliadoRow): number {
  const age = calculateAge(afiliado.fechaNacimiento);
  const plan = planOptions.find(
    (p) => p.id === afiliado.planSolicitado && p.defaultCoverage === afiliado.limiteCobertura
  );
  return getMonthlyPrice(plan, age) || 0;
}

interface Step3Props {
  afiliados: AfiliadoRow[];
  onChangeAfiliados: (afiliados: AfiliadoRow[]) => void;
  frecuenciaPago: FrecuenciaPago;
  onChangeFrecuenciaPago: (frecuencia: FrecuenciaPago) => void;
  titularNombreCompleto?: string;
  titularDoc?: string;
}

export const Step3AfiliadosPlan: React.FC<Step3Props> = ({
  afiliados,
  onChangeAfiliados,
  frecuenciaPago,
  onChangeFrecuenciaPago,
}) => {
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0);
  const [pricingStyle, setPricingStyle] = useState<PricingStyle>('cards');
  const memberNameInputRef = useRef<HTMLInputElement | null>(null);

  const selectMemberForEditing = (index: number) => {
    setSelectedMemberIndex(index);

    window.requestAnimationFrame(() => {
      memberNameInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      window.setTimeout(() => {
        memberNameInputRef.current?.focus({ preventScroll: true });
      }, 500);
    });
  };

  const normalizeAfiliados = (items: AfiliadoRow[]) =>
    items.map((item, index) => {
      const cuotaCalculada = getAfiliadoCuota(item);
      return {
        ...item,
        codigoAfiliado: index + 1,
        cuota: cuotaCalculada,
      };
    });

  const addAfiliado = () => {
    const newAfiliado: AfiliadoRow = {
      id: Math.random().toString(36).substring(2, 9),
      codigoAfiliado: 0,
      nombreCompleto: '',
      tipoDoc: 'V',
      numDoc: '',
      fechaNacimiento: '',
      parentesco: 'Hijo/a',
      sexo: 'M',
      pesoKg: '',
      estaturaCm: '',
      planSolicitado: 'Plan Oro',
      limiteCobertura: '$25.000',
      cuota: 0,
    };
    const updated = normalizeAfiliados([...afiliados, newAfiliado]);
    onChangeAfiliados(updated);
    selectMemberForEditing(updated.length - 1);
  };

  const updateAfiliado = (index: number, fields: Partial<AfiliadoRow>) => {
    const updated = [...afiliados];
    updated[index] = { ...updated[index], ...fields };
    onChangeAfiliados(normalizeAfiliados(updated));
  };

  const currentMember = afiliados[selectedMemberIndex] || afiliados[0];
  const currentAge = calculateAge(currentMember?.fechaNacimiento || '');
  const currentRange = getAgeRange(currentAge);
  const availablePlans = currentRange === '61-80'
    ? planOptions.filter((plan) => plan.id === 'Abuelos')
    : planOptions.filter((plan) => plan.id !== 'Abuelos');

  const selectPlan = (plan: PlanOption) => {
    const monthlyPrice = getMonthlyPrice(plan, currentAge) || 0;
    updateAfiliado(selectedMemberIndex, {
      planSolicitado: plan.id,
      limiteCobertura: plan.defaultCoverage,
      cuota: monthlyPrice,
    });
  };

  const validateBirthDate = (fechaNacimiento: string) => {
    const age = calculateAge(fechaNacimiento);

    if (age === null || age > 80) {
      alert('No se puede registrar como beneficiario a una persona mayor de 80 años.');
      return;
    }

    const range = getAgeRange(age);
    const currentPlan = planOptions.find(
      (plan) => plan.id === currentMember.planSolicitado && plan.defaultCoverage === currentMember.limiteCobertura,
    );

    if (range === '61-80') {
      updateAfiliado(selectedMemberIndex, {
        planSolicitado: 'Abuelos',
        limiteCobertura: '$3.000',
      });
      return;
    }

    if (currentPlan?.id === 'Abuelos') {
      updateAfiliado(selectedMemberIndex, {
        planSolicitado: 'Plan Bronce',
        limiteCobertura: '$10.000',
      });
    } else {
      updateAfiliado(selectedMemberIndex, { fechaNacimiento });
    }
  };

  const removeAfiliado = (index: number) => {
    if (afiliados.length <= 1) {
      alert('Debe existir al menos una persona en el grupo a afiliar (el Titular).');
      return;
    }
    const filtered = normalizeAfiliados(afiliados.filter((_, i) => i !== index));
    onChangeAfiliados(filtered);
    if (selectedMemberIndex >= filtered.length) {
      setSelectedMemberIndex(filtered.length - 1);
    }
  };

  // Sumatoria total de las cuotas de todos los beneficiarios sin impuestos
  const subtotalGrupo = afiliados.reduce((sum, item) => sum + getAfiliadoCuota(item), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Grid: Grupo Familiar y Selección de Plan */}
      <div className="grid grid-cols-2 gap-6">
        {/* GRUPO FAMILIAR (Izquierda) */}
        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="family-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Grupo Familiar
              </h3>
            </div>

            <button
              type="button"
              onClick={addAfiliado}
              className="btn-pill btn-pill-outline"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
            >
              <UserPlus size={14} /> + Agregar Familiar
            </button>
          </div>

          {/* Lista de Miembros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {afiliados.map((af, idx) => {
              const isSelected = idx === selectedMemberIndex;
              const cuotaAfiliado = getAfiliadoCuota(af);

              return (
                <div
                  key={af.id}
                  className="family-member-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => selectMemberForEditing(idx)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectMemberForEditing(idx);
                    }
                  }}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--previasis-green)' : 'var(--border-card)',
                    backgroundColor: isSelected ? 'var(--previasis-green-light)' : '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: isSelected ? '0 4px 12px var(--previasis-green-glow)' : 'none',
                  }}
                >
                  <div className="family-member-main" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--previasis-green)' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : 'var(--text-body)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {af.codigoAfiliado}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--previasis-dark-green)' }}>
                        {af.nombreCompleto || `Persona #${af.codigoAfiliado}`}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {af.parentesco} • {af.planSolicitado} ({af.limiteCobertura})
                        {' · '}
                        {calculateAge(af.fechaNacimiento) === null
                          ? 'Edad pendiente'
                          : `${calculateAge(af.fechaNacimiento)} años`}
                      </p>
                      <p style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--previasis-green)', marginTop: '2px' }}>
                        Cuota: ${cuotaAfiliado} / mes
                      </p>
                    </div>
                  </div>

                  <div className="family-member-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {idx === 0 ? (
                      <span className="pill-badge" style={{ fontSize: '0.6875rem' }}>
                        Titular
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                          }}
                        >
                          CÓDIGO: #{af.codigoAfiliado}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAfiliado(idx);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--status-error)',
                            cursor: 'pointer',
                            padding: '0.375rem',
                          }}
                          title="Eliminar familiar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <section className="billing-preview" aria-labelledby="billing-preview-title">
            <div className="billing-preview-heading">
              <span className="billing-preview-eyebrow">Subtotal del grupo familiar</span>
              <h4 id="billing-preview-title">
                ${subtotalGrupo * (billingPeriods.find((period) => period.id === frecuenciaPago)?.months || 1)}<sup>*</sup>
              </h4>
              <p>
                Pago {frecuenciaPago.toLocaleLowerCase('es-VE')} · equivalente a ${subtotalGrupo} al mes
              </p>
            </div>

            <div className="billing-style-picker" aria-label="Comparar estilos del selector">
              <span>Vista para evaluación:</span>
              {([
                ['cards', 'Opción 1'],
                ['segmented', 'Opción 2'],
                ['compact', 'Opción 3'],
              ] as Array<[PricingStyle, string]>).map(([style, label]) => (
                <button
                  key={style}
                  type="button"
                  className={pricingStyle === style ? 'active' : ''}
                  onClick={() => setPricingStyle(style)}
                  aria-pressed={pricingStyle === style}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={`billing-periods billing-periods--${pricingStyle}`}>
              {billingPeriods.map((period) => {
                const isSelected = frecuenciaPago === period.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    className={`billing-period ${isSelected ? 'selected' : ''}`}
                    onClick={() => onChangeFrecuenciaPago(period.id)}
                    aria-pressed={isSelected}
                  >
                    {period.id === 'Mensual' && (
                      <span className="billing-popular-badge">
                        <Flame size={13} fill="currentColor" /> Más solicitado
                      </span>
                    )}
                    <span className="billing-period-name">{period.id}</span>
                    <strong>${subtotalGrupo * period.months}</strong>
                    <small>{period.shortLabel}</small>
                    {isSelected && <Check className="billing-period-check" size={16} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <p className="billing-tax-note">* Los precios indicados no incluyen impuestos.</p>
          </section>
        </div>

        {/* SELECCIÓN DE PLAN (Derecha) */}
        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Selección de Plan
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Para: <strong>{currentMember.nombreCompleto || `Persona #${currentMember.codigoAfiliado}`}</strong>
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {currentAge === null
              ? 'Ingresa una fecha de nacimiento para calcular la tarifa.'
              : currentRange === '61-80'
                ? 'Plan Abuelos · válido para personas de 61 a 80 años.'
                : currentRange === null
                  ? 'Edad fuera de los rangos tarifarios publicados.'
                  : `Tarifas para el rango de edad ${currentRange} años.`}
          </p>

          <div className={`grid ${availablePlans.length > 4 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {availablePlans.map((plan) => {
              const isPlanSelected = currentMember.planSolicitado === plan.id
                && currentMember.limiteCobertura === plan.defaultCoverage;
              const monthlyPrice = getMonthlyPrice(plan, currentAge);

              return (
                <button
                  type="button"
                  key={`${plan.id}-${plan.defaultCoverage}`}
                  onClick={() => selectPlan(plan)}
                  className={`plan-gradient-card ${plan.classStyle} ${isPlanSelected ? 'selected' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px', textAlign: 'left' }}
                  aria-pressed={isPlanSelected}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <Award size={18} />
                      {isPlanSelected && (
                        <span style={{ backgroundColor: '#ffffff', color: '#073E23', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.9375rem', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      {plan.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      {plan.defaultCoverage} cobertura anual
                    </p>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.6875rem', opacity: 0.9 }}>Cuota mensual</p>
                    <strong style={{ fontSize: '1.25rem' }}>
                      {monthlyPrice === null ? 'Consultar' : `$${monthlyPrice}`}
                    </strong>
                    
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETALLES DEL MIEMBRO SELECCIONADO */}
      <div className="previasis-card">
        <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--previasis-dark-green)', marginBottom: '1.25rem' }}>
          Datos de: {currentMember.nombreCompleto || `Persona #${currentMember.codigoAfiliado}`}
        </h4>

        <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
          <div className="previasis-input-group">
            <label className="previasis-label">
              Nombre(s) y Apellido(s) <span className="previasis-label-required">*</span>
            </label>
            <input
              ref={memberNameInputRef}
              type="text"
              className="previasis-input"
              placeholder="Nombre completo"
              value={currentMember.nombreCompleto}
              onChange={(e) => updateAfiliado(selectedMemberIndex, { nombreCompleto: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Cédula de Identidad / R.I.F. <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={currentMember.tipoDoc}
                onChange={(e) => updateAfiliado(selectedMemberIndex, { tipoDoc: e.target.value as TipoDocumento })}
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678"
                value={currentMember.numDoc}
                onChange={(e) => updateAfiliado(selectedMemberIndex, { numDoc: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1rem' }}>
          <div className="previasis-input-group">
            <label className="previasis-label">
              Fecha de Nacimiento <span className="previasis-label-required">*</span>
            </label>
            <input
              type="date"
              className="previasis-input"
              min={getMinimumBirthDate()}
              max={new Date().toISOString().slice(0, 10)}
              value={currentMember.fechaNacimiento}
              onChange={(e) => updateAfiliado(selectedMemberIndex, { fechaNacimiento: e.target.value })}
              onBlur={() => validateBirthDate(currentMember.fechaNacimiento)}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Parentesco <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={currentMember.parentesco}
              onChange={(e) => updateAfiliado(selectedMemberIndex, { parentesco: e.target.value as Parentesco })}
            >
              <option value="Titular">Titular</option>
              <option value="Cónyuge">Cónyuge / Esposo(a)</option>
              <option value="Hijo/a">Hijo/a</option>
              <option value="Padre/Madre">Padre/Madre</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Sexo <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              <button
                type="button"
                onClick={() => updateAfiliado(selectedMemberIndex, { sexo: 'M' })}
                className={`pill-switch-btn ${currentMember.sexo === 'M' ? 'active' : ''}`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => updateAfiliado(selectedMemberIndex, { sexo: 'F' })}
                className={`pill-switch-btn ${currentMember.sexo === 'F' ? 'active' : ''}`}
              >
                F
              </button>
            </div>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Límite de Cobertura <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              readOnly
              value={currentMember.limiteCobertura}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Peso (kg) <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="70"
              value={currentMember.pesoKg}
              onChange={(e) => updateAfiliado(selectedMemberIndex, { pesoKg: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Estatura (cm) <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="175"
              value={currentMember.estaturaCm}
              onChange={(e) => updateAfiliado(selectedMemberIndex, { estaturaCm: e.target.value })}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3AfiliadosPlan;
