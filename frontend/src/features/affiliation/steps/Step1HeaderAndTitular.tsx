'use client';

import React from 'react';
import {
  HeaderSection,
  PersonaNaturalData,
  TipoOperacion,
  TipoContrato,
  TipoDocumento,
  TipoRif,
  EstadoCivil,
  Sexo,
  ClasificacionActividad,
} from '@/core/interfaces/affiliation.interfaces';
import { getCitiesByState, VENEZUELA_STATES } from '@/core/config/venezuela-locations.config';
import { User, Shield, MapPin, Phone, Mail } from 'lucide-react';

interface Step1Props {
  header: HeaderSection;
  titular: PersonaNaturalData;
  onChangeHeader: (header: HeaderSection) => void;
  onChangeTitular: (titular: PersonaNaturalData) => void;
}

export const Step1HeaderAndTitular: React.FC<Step1Props> = ({
  header,
  titular,
  onChangeHeader,
  onChangeTitular,
}) => {
  const updateHeader = (fields: Partial<HeaderSection>) => {
    onChangeHeader({ ...header, ...fields });
  };

  const updateTitular = (fields: Partial<PersonaNaturalData>) => {
    onChangeTitular({ ...titular, ...fields });
  };

  const esComerciante = (titular.ocupacion || '').trim().toLowerCase().includes('comerciante');
  const availableCities = getCitiesByState(titular.estadoResidencia);

  return (
    <div className="step1-layout">
      {/* SECCIÓN 1: CABECERA Y CONTROL DE EMISIÓN */}
      <div className="previasis-card step1-card" style={{ borderLeft: '4px solid var(--previasis-green)' }}>
        <div className="step1-section-header">
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
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Control de Emisión y Tipo de Contrato
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Providencia Sudeaseg Nº SAA-09-1585 • RIF J-412048970 
                {/* TODO: el riff deberia ser una propiedad almacenada en alguna DB */}
              </p>
            </div>
          </div>
          <span className="pill-badge">Sección 1</span>
        </div>

        <div className="step1-control-grid">
          {/* Tipo de Operación Pill Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              Tipo de Operación <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Emisión', 'Inclusión'] as TipoOperacion[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => updateHeader({ tipoOperacion: op })}
                  className={`pill-switch-btn ${header.tipoOperacion === op ? 'active' : ''}`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Contrato Pill Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              Tipo de Contrato <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Individual', 'Colectivo'] as TipoContrato[]).map((co) => (
                <button
                  key={co}
                  type="button"
                  onClick={() => updateHeader({ tipoContrato: co })}
                  className={`pill-switch-btn ${header.tipoContrato === co ? 'active' : ''}`}
                >
                  {co}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="step1-form-grid step1-identity-grid">

          <div className="previasis-input-group">
            <label className="previasis-label">Nº de Solicitud (Opcional)</label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ej: SOL-2026-0001"
              value={header.numSolicitud || ''}
              onChange={(e) => updateHeader({ numSolicitud: e.target.value })}
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Fecha de la Solicitud <span className="previasis-label-required">*</span>
            </label>
            <input
              type="date"
              className="previasis-input"
              value={header.fechaSolicitud}
              onChange={(e) => updateHeader({ fechaSolicitud: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DEL PROPUESTO AFILIADO TITULAR */}
      <div className="previasis-card step1-card">
        <div className="step1-section-header step1-section-header-large">
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
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Datos del Titular
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Información personal, fiscal y de contacto del proponente principal
              </p>
            </div>
          </div>
          <span className="pill-badge">Sección 2</span>
        </div>

        {/* Nombres y Apellidos */}
        <div className="step1-form-grid step1-form-grid-3">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Cédula de Identidad / Pasaporte <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={titular.tipoDoc}
                onChange={(e) => updateTitular({ tipoDoc: e.target.value as TipoDocumento })}
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678"
                value={titular.numDoc}
                onChange={(e) => updateTitular({ numDoc: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>
          </div>
          <div className="previasis-input-group">
            <label className="previasis-label">
              Nombres <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Primer y segundo nombre"
              value={titular.nombres}
              onChange={(e) => updateTitular({ nombres: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Apellidos <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Primer y segundo apellido"
              value={titular.apellidos}
              onChange={(e) => updateTitular({ apellidos: e.target.value })}
              required
            />
          </div>
          
        </div>

        {/* Nacionalidad, Estado Civil, Sexo */}
        <div className="step1-form-grid step1-form-grid-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Registro de Información Fiscal (R.I.F.) <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={titular.tipoRif}
                onChange={(e) => updateTitular({ tipoRif: e.target.value as TipoRif })}
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="J">J-</option>
                <option value="G">G-</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678-0"
                value={titular.numRif}
                onChange={(e) => updateTitular({ numRif: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="previasis-input-group">
            <label className="previasis-label">
              Nacionalidad <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={titular.nacionalidad}
              onChange={(e) => updateTitular({ nacionalidad: e.target.value })}
            >
              <option value="Venezolana">Venezolano/a</option>
              <option value="Extranjera">Extranjero/a</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Estado Civil <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={titular.estadoCivil}
              onChange={(e) => updateTitular({ estadoCivil: e.target.value as EstadoCivil })}
            >
              <option value="Soltero(a)">Soltero/a</option>
              <option value="Casado(a)">Casado/a</option>
              <option value="Divorciado(a)">Divorciado/a</option>
              <option value="Viudo(a)">Viudo/a</option>
              <option value="Concubinato">Concubinato</option>
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Sexo <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch" style={{ width: '100%' }}>
              <button
                type="button"
                style={{ flex: 1 }}
                onClick={() => updateTitular({ sexo: 'M' })}
                className={`pill-switch-btn ${titular.sexo === 'M' ? 'active' : ''}`}
              >
                Masculino (M)
              </button>
              <button
                type="button"
                style={{ flex: 1 }}
                onClick={() => updateTitular({ sexo: 'F' })}
                className={`pill-switch-btn ${titular.sexo === 'F' ? 'active' : ''}`}
              >
                Femenino (F)
              </button>
            </div>
          </div>
        </div>

        {/* Estado y Ciudad de residencia */}
        <div className="step1-form-grid step1-form-grid-2">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Estado <span className="previasis-label-required">*</span>
            </label>
            <select
              className="previasis-input"
              value={titular.estadoResidencia || ''}
              onChange={(e) => updateTitular({
                estadoResidencia: e.target.value,
                ciudadResidencia: '',
              })}
              required
            >
              <option value="">Seleccione un estado</option>
              {VENEZUELA_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Ciudad <span className="previasis-label-required">*</span>
            </label>
            <select
              key={titular.estadoResidencia || 'sin-estado'}
              className="previasis-input"
              value={titular.ciudadResidencia || ''}
              onChange={(e) => updateTitular({ ciudadResidencia: e.target.value })}
              disabled={!titular.estadoResidencia}
              required
            >
              <option value="">
                {titular.estadoResidencia ? 'Seleccione una ciudad' : 'Seleccione primero un estado'}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lugar y Fecha Nacimiento */}
        <div className="step1-form-grid step1-form-grid-2">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Lugar de Nacimiento <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Caracas, Dto. Capital, Venezuela"
              value={titular.lugarNacimiento}
              onChange={(e) => updateTitular({ lugarNacimiento: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Fecha de Nacimiento <span className="previasis-label-required">*</span>
            </label>
            <input
              type="date"
              className="previasis-input"
              value={titular.fechaNacimiento}
              onChange={(e) => updateTitular({ fechaNacimiento: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Profesión, Ocupación, Ingreso Mensual/Anual */}
        <div className="step1-form-grid step1-form-grid-3">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Profesión <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ingeniero, Médico, Abogado..."
              value={titular.profesion}
              onChange={(e) => updateTitular({ profesion: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Ocupación <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ej: Comerciante, Ejecutivo, Tecnólogo..."
              value={titular.ocupacion}
              onChange={(e) => updateTitular({ ocupacion: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Ingreso Anual / Mensual (Bs. / USD) <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Monto sin cálculos (ej. $4.200,00)"
              value={titular.ingresoAnualBs}
              onChange={(e) => updateTitular({ ingresoAnualBs: e.target.value })}
              required
            />
          </div>
        </div>

        {esComerciante && (
          <div className="step1-form-grid step1-form-grid-1">
            <div className="previasis-input-group">
              <label className="previasis-label">
                Ramo al que se dedica <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                placeholder="Ej: Ferretería, Textiles, Alimentos..."
                value={titular.ramoComercial || ''}
                onChange={(e) => updateTitular({ ramoComercial: e.target.value })}
                required
              />
            </div>
          </div>
        )}

        {/* Actividad y PEP */}
        <div className="step1-context-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="previasis-label">
              Clasificación de Actividad <span className="previasis-label-required">*</span>
            </label>
            <div className="pill-switch">
              {(['Independiente', 'Dependiente', 'Societaria'] as ClasificacionActividad[]).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => updateTitular({ clasificacionActividad: act })}
                  className={`pill-switch-btn ${titular.clasificacionActividad === act ? 'active' : ''}`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="previasis-label">
                Persona Expuesta Políticamente (PEP) <span className="previasis-label-required">*</span>
              </label>
              <div className="pill-switch">
                <button
                  type="button"
                  onClick={() => updateTitular({ pep: 'NO' })}
                  className={`pill-switch-btn ${titular.pep === 'NO' ? 'active' : ''}`}
                >
                  NO
                </button>
                <button
                  type="button"
                  onClick={() => updateTitular({ pep: 'SÍ' })}
                  className={`pill-switch-btn ${titular.pep === 'SÍ' ? 'active' : ''}`}
                >
                  SÍ
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Indique si usted o algún familiar ocupa cargo público relevante.
            </p>
          </div>
        </div>

        {titular.clasificacionActividad === 'Dependiente' && (
          <div className="previasis-input-group step1-field-wide">
            <label className="previasis-label">
              Empresa donde labora <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Nombre de la empresa"
              value={titular.empresa || ''}
              onChange={(e) => updateTitular({ empresa: e.target.value })}
              required
            />
          </div>
        )}

        {titular.pep === 'SÍ' && (
          <div className="previasis-input-group step1-field-wide">
            <label className="previasis-label">
              Descripción de la Actividad / Cargo PEP <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Indique cargo o institución"
              value={titular.pepDescripcion || ''}
              onChange={(e) => updateTitular({ pepDescripcion: e.target.value })}
              required
            />
          </div>
        )}

        {/* Direcciones */}
        <div className="step1-address-group">
          <div className="step1-form-grid step1-form-grid-3">
             <div className="previasis-input-group">
            <label className="previasis-label">
              <MapPin size={16} color="var(--previasis-green)" />
              Dirección de Residencia / Habitación <span className="previasis-label-required">*</span>
            </label>
            <input
              className="previasis-input"
              type="text"
              placeholder="Av., Calle, Edificio/Casa, Apto., Sector, Parroquia, Ciudad, Estado"
              value={titular.direccionHabitacion}
              onChange={(e) => updateTitular({ direccionHabitacion: e.target.value })}
              required
            />
          </div>
            <div className="previasis-input-group">
              <label className="previasis-label">Dirección de Oficina</label>
              <input
                type="text"
                className="previasis-input"
                placeholder="Dirección laboral u oficina"
                value={titular.direccionOficina}
                onChange={(e) => updateTitular({ direccionOficina: e.target.value })}
              />
            </div>

            <div className="previasis-input-group">
              <label className="previasis-label">
                Dirección de Cobro <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                placeholder="Habitación, Oficina u Otra"
                value={titular.direccionCobro}
                onChange={(e) => updateTitular({ direccionCobro: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Contacto: Teléfonos y Email */}
        <div className="step1-form-grid step1-form-grid-3 step1-contact-grid">
          <div className="previasis-input-group">
            <label className="previasis-label">
              <Phone size={16} color="var(--previasis-green)" />
              Teléfono Local
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="0212-XXXXXXX"
              value={titular.telefonoHabitacion}
              onChange={(e) => updateTitular({ telefonoHabitacion: e.target.value })}
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              <Phone size={16} color="var(--previasis-green)" />
              Teléfono Móvil <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="0412-1234567"
              value={titular.telefonoMovil}
              onChange={(e) => updateTitular({ telefonoMovil: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              <Mail size={16} color="var(--previasis-green)" />
              Correo Electrónico <span className="previasis-label-required">*</span>
            </label>
            <input
              type="email"
              className="previasis-input"
              placeholder="usuario@ejemplo.com"
              value={titular.email}
              onChange={(e) => updateTitular({ email: e.target.value })}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1HeaderAndTitular;
