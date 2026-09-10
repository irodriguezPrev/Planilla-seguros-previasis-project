'use client';

import React from 'react';
import { Card } from '@/core/components/ui/Card';
import { Input } from '@/core/components/ui/Input';
import { Badge } from '@/core/components/ui/Badge';
import {
  contractorSection,
  PersonaNaturalData,
  PersonaJuridicaData,
  // TipoPersonacontractor,
  TipoDocumento,
  TipoRif,
  EstadoCivil,
  Sexo,
  // ClasificacionActividad,
  ActividadEconomicaJuridica,
} from '@/core/interfaces/affiliation.interfaces';

interface Step2Props {
  contractor: contractorSection;
  onChangeContractor: (contractor: contractorSection) => void;
}

export const Step2contractor: React.FC<Step2Props> = ({
  contractor,
  onChangeContractor,
}) => {
  const updatecontractor = (fields: Partial<contractorSection>) => {
    onChangeContractor({ ...contractor, ...fields });
  };

  const updateNatural = (fields: Partial<PersonaNaturalData>) => {
    onChangeContractor({
      ...contractor,
      personaNatural: { ...contractor.personaNatural, ...fields },
    });
  };

  const updateJuridica = (fields: Partial<PersonaJuridicaData>) => {
    onChangeContractor({
      ...contractor,
      personaJuridica: { ...contractor.personaJuridica, ...fields },
    });
  };

  const updateTutor = (fields: Partial<PersonaNaturalData>) => {
    onChangeContractor({
      ...contractor,
      personaJuridica: {
        ...contractor.personaJuridica,
        representanteLegal: {
          ...contractor.personaJuridica.representanteLegal,
          ...fields,
        },
      },
    });
  };

  const nat = contractor.personaNatural;
  const jur = contractor.personaJuridica;
  const rep = jur.representanteLegal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <Badge variant="info">Sección 3</Badge>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
            Datos del contractor
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Persona natural o jurídica responsable de la contratación y pago del plan
          </p>
        </div>

        {/* Toggle si el contractor es diferente al titular */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="checkbox"
            id="contractorDiferente"
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            checked={contractor.esDiferente}
            onChange={(e) => updatecontractor({ esDiferente: e.target.checked })}
          />
          <label htmlFor="contractorDiferente" style={{ fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
            ¿El contractor es diferente al Propuesto Afiliado Titular?
          </label>
        </div>

        {!contractor.esDiferente ? (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              El contractor es el mismo Afiliado Titular.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Los datos personales, fiscales y de contacto capturados en el Paso 1 se utilizarán automáticamente en el documento oficial.
            </p>
          </div>
        ) : (
          /* Renderizado si el contractor es DIFERENTE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Selector Persona Natural vs Persona Jurídica */}
            <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoPersonacontractor"
                  value="Natural"
                  checked={contractor.tipoPersona === 'Natural'}
                  onChange={() => updatecontractor({ tipoPersona: 'Natural' })}
                />
                <span>Persona Natural</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tipoPersonacontractor"
                  value="Juridica"
                  checked={contractor.tipoPersona === 'Juridica'}
                  onChange={() => updatecontractor({ tipoPersona: 'Juridica' })}
                />
                <span>Persona Jurídica (Empresa / Institución)</span>
              </label>
            </div>

            {/* PERSONA NATURAL contractor */}
            {contractor.tipoPersona === 'Natural' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">Cédula / Pasaporte *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="input-field"
                        style={{ width: '80px', flex: '0 0 auto' }}
                        value={nat.tipoDoc}
                        onChange={(e) => updateNatural({ tipoDoc: e.target.value as TipoDocumento })}
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="P">P-</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="12345678"
                        value={nat.numDoc}
                        onChange={(e) => updateNatural({ numDoc: e.target.value.replace(/\D/g, '') })}
                        required
                      />
                    </div>
                  </div>
                  <Input
                    label="Nombres *"
                    value={nat.nombres}
                    onChange={(e) => updateNatural({ nombres: e.target.value })}
                    required
                  />
                  <Input
                    label="Apellidos *"
                    value={nat.apellidos}
                    onChange={(e) => updateNatural({ apellidos: e.target.value })}
                    required
                  />


                  
                </div>



                <div className="grid grid-cols-4 gap-4">
                  <div className="input-group">
                      <label className="input-label">R.I.F. *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="input-field"
                          style={{ width: '80px', flex: '0 0 auto' }}
                          value={nat.tipoRif}
                          onChange={(e) => updateNatural({ tipoRif: e.target.value as TipoRif })}
                        >
                          <option value="V">V-</option>
                          <option value="E">E-</option>
                          <option value="J">J-</option>
                          <option value="G">G-</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="12345678-0"
                          value={nat.numRif}
                          onChange={(e) => updateNatural({ numRif: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  <Input
                    label="Nacionalidad *"
                    value={nat.nacionalidad}
                    onChange={(e) => updateNatural({ nacionalidad: e.target.value })}
                    required
                  />
                  <div className="input-group">
                    <label className="input-label">Estado Civil *</label>
                    <select
                      className="input-field"
                      value={nat.estadoCivil}
                      onChange={(e) => updateNatural({ estadoCivil: e.target.value as EstadoCivil })}
                    >
                      <option value="Soltero(a)">Soltero(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viudo(a)">Viudo(a)</option>
                      <option value="Concubinato">Concubinato</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sexo *</label>
                    <select
                      className="input-field"
                      value={nat.sexo}
                      onChange={(e) => updateNatural({ sexo: e.target.value as Sexo })}
                    >
                      <option value="M">Masculino (M)</option>
                      <option value="F">Femenino (F)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Fecha de Nacimiento *"
                    type="date"
                    value={nat.fechaNacimiento}
                    onChange={(e) => updateNatural({ fechaNacimiento: e.target.value })}
                    required
                  />
                  <Input
                    label="Profesión *"
                    value={nat.profesion}
                    onChange={(e) => updateNatural({ profesion: e.target.value })}
                    required
                  />
                  <Input
                    label="Ocupación *"
                    value={nat.ocupacion}
                    onChange={(e) => updateNatural({ ocupacion: e.target.value })}
                    required
                  />
                  <Input
                    label="Ingreso Anual (Bs.) *"
                    value={nat.ingresoAnualBs}
                    onChange={(e) => updateNatural({ ingresoAnualBs: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Lugar de Nacimiento *"
                    value={nat.lugarNacimiento}
                    onChange={(e) => updateNatural({ lugarNacimiento: e.target.value })}
                    required
                  />
                  <Input
                    label="Teléfono Local *"
                    value={nat.telefonoHabitacion}
                    onChange={(e) => updateNatural({ telefonoHabitacion: e.target.value })}
                    required
                  />
                  <Input
                    label="Teléfono Móvil *"
                    value={nat.telefonoMovil}
                    onChange={(e) => updateNatural({ telefonoMovil: e.target.value })}
                    required
                  />
                  <Input
                    label="Correo Electrónico *"
                    type="email"
                    value={nat.email}
                    onChange={(e) => updateNatural({ email: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Dirección de Habitación *</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={nat.direccionHabitacion}
                    onChange={(e) => updateNatural({ direccionHabitacion: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* PERSONA JURÍDICA contractor */}
            {contractor.tipoPersona === 'Juridica' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  Datos de la Empresa / Persona Jurídica
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Razón Social *"
                    placeholder="Nombre completo de la empresa"
                    value={jur.razonSocial}
                    onChange={(e) => updateJuridica({ razonSocial: e.target.value })}
                    required
                  />
                  <div className="input-group">
                    <label className="input-label">R.I.F. Jurídico (J-XXXXXXXX-X) *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="input-field"
                        style={{ width: '80px', flex: '0 0 auto' }}
                        value={jur.tipoRif}
                        onChange={(e) => updateJuridica({ tipoRif: e.target.value as any })}
                      >
                        <option value="J">J-</option>
                        <option value="G">G-</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="12345678-9"
                        value={jur.numRif}
                        onChange={(e) => updateJuridica({ numRif: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Nº Registro Mercantil *"
                    placeholder="Registro Mercantil Segundo..."
                    value={jur.numRegistroMercantil}
                    onChange={(e) => updateJuridica({ numRegistroMercantil: e.target.value })}
                    required
                  />
                  <Input
                    label="Nº de Tomo *"
                    placeholder="Tomo 12-A"
                    value={jur.numTomo}
                    onChange={(e) => updateJuridica({ numTomo: e.target.value })}
                    required
                  />
                  <Input
                    label="Fecha de Registro *"
                    type="date"
                    value={jur.fechaRegistro}
                    onChange={(e) => updateJuridica({ fechaRegistro: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="input-label" style={{ fontWeight: 600 }}>Actividad Económica *</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {(['Profesional', 'Comercial', 'Industrial'] as ActividadEconomicaJuridica[]).map((act) => (
                        <label key={act} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="actividadEconomicaJuridica"
                            value={act}
                            checked={jur.actividadEconomica === act}
                            onChange={() => updateJuridica({ actividadEconomica: act })}
                          />
                          <span>{act}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Productos y Servicios que Ofrece *"
                    placeholder="Descripción de la oferta comercial"
                    value={jur.productosServicios}
                    onChange={(e) => updateJuridica({ productosServicios: e.target.value })}
                    required
                  />

                  {jur.actividadEconomica === 'Comercial' && (
                    <Input
                      label="Ramo Comercial *"
                      placeholder="Ej: Venta de equipos médicos"
                      value={jur.ramoComercial || ''}
                      onChange={(e) => updateJuridica({ ramoComercial: e.target.value })}
                      required
                    />
                  )}
                </div>

                

                <div className="input-group">
                  <label className="input-label">Dirección Fiscal Completa *</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    placeholder="Dirección fiscal legal"
                    value={jur.direccionFiscal}
                    onChange={(e) => updateJuridica({ direccionFiscal: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Utilidad del Ejercicio Económico Anterior (Bs.) *"
                    placeholder="Monto sin cálculos"
                    value={jur.utilidadEjercicioAnterior}
                    onChange={(e) => updateJuridica({ utilidadEjercicioAnterior: e.target.value })}
                    required
                  />
                  <Input
                    label="Patrimonio Neto (Bs.) *"
                    placeholder="Monto sin cálculos"
                    value={jur.patrimonioNeto}
                    onChange={(e) => updateJuridica({ patrimonioNeto: e.target.value })}
                    required
                  />
                  <Input
                    label="Teléfono de la Empresa *"
                    placeholder="0212-XXXXXXX"
                    value={jur.telefono}
                    onChange={(e) => updateJuridica({ telefono: e.target.value })}
                    required
                  />
                </div>

                {/* REPRESENTANTE LEGAL PERSONA JURIDICA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4>Datos del Representante</h4>  
                <div className="grid grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">Cédula / Pasaporte *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="input-field"
                        style={{ width: '80px', flex: '0 0 auto' }}
                        value={rep.tipoDoc}
                        onChange={(e) => updateTutor({ tipoDoc: e.target.value as TipoDocumento })}
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                        <option value="P">P-</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="12345678"
                        value={rep.numDoc}
                        onChange={(e) => updateTutor({ numDoc: e.target.value.replace(/\D/g, '') })}
                        required
                      />
                    </div>
                  </div>
                  <Input
                    label="Nombres *"
                    value={rep.nombres}
                    onChange={(e) => updateTutor({ nombres: e.target.value })}
                    required
                  />
                  <Input
                    label="Apellidos *"
                    value={rep.apellidos}
                    onChange={(e) => updateTutor({ apellidos: e.target.value })}
                    required
                  />    
                </div>

                <div className="previasis-input-group step1-field-wide">
            <label className="previasis-label">
              Descripción de la Actividad / Cargo PEP <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Indique cargo o institución"
              value={rep.pepDescripcion || ''}
              onChange={(e) => updateTutor({ pepDescripcion: e.target.value })}
              required
            />
          </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="input-group">
                      <label className="input-label">R.I.F. *</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          className="input-field"
                          style={{ width: '80px', flex: '0 0 auto' }}
                          value={rep.tipoRif}
                          onChange={(e) => updateTutor({ tipoRif: e.target.value as TipoRif })}
                        >
                          <option value="V">V-</option>
                          <option value="E">E-</option>
                          <option value="J">J-</option>
                          <option value="G">G-</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="12345678-0"
                          value={rep.numRif}
                          onChange={(e) => updateTutor({ numRif: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  <Input
                    label="Nacionalidad *"
                    value={rep.nacionalidad}
                    onChange={(e) => updateTutor({ nacionalidad: e.target.value })}
                    required
                  />
                  <div className="input-group">
                    <label className="input-label">Estado Civil *</label>
                    <select
                      className="input-field"
                      value={rep.estadoCivil}
                      onChange={(e) => updateTutor({ estadoCivil: e.target.value as EstadoCivil })}
                    >
                      <option value="Soltero(a)">Soltero(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viudo(a)">Viudo(a)</option>
                      <option value="Concubinato">Concubinato</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sexo *</label>
                    <select
                      className="input-field"
                      value={rep.sexo}
                      onChange={(e) => updateTutor({ sexo: e.target.value as Sexo })}
                    >
                      <option value="M">Masculino (M)</option>
                      <option value="F">Femenino (F)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Fecha de Nacimiento *"
                    type="date"
                    value={rep.fechaNacimiento}
                    onChange={(e) => updateTutor({ fechaNacimiento: e.target.value })}
                    required
                  />
                  <Input
                    label="Profesión *"
                    value={rep.profesion}
                    onChange={(e) => updateTutor({ profesion: e.target.value })}
                    required
                  />
                  <Input
                    label="Ocupación *"
                    value={rep.ocupacion}
                    onChange={(e) => updateTutor({ ocupacion: e.target.value })}
                    required
                  />
                  <Input
                    label="Ingreso Anual (Bs.) *"
                    value={rep.ingresoAnualBs}
                    onChange={(e) => updateTutor({ ingresoAnualBs: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Lugar de Nacimiento *"
                    value={rep.lugarNacimiento}
                    onChange={(e) => updateTutor({ lugarNacimiento: e.target.value })}
                    required
                  />
                  <Input
                    label="Teléfono Local *"
                    value={rep.telefonoHabitacion}
                    onChange={(e) => updateTutor({ telefonoHabitacion: e.target.value })}
                    required
                  />
                  <Input
                    label="Teléfono Móvil *"
                    value={rep.telefonoMovil}
                    onChange={(e) => updateTutor({ telefonoMovil: e.target.value })}
                    required
                  />
                  <Input
                    label="Correo Electrónico *"
                    type="email"
                    value={rep.email}
                    onChange={(e) => updateTutor({ email: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Dirección de Habitación *</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={rep.direccionHabitacion}
                    onChange={(e) => updateTutor({ direccionHabitacion: e.target.value })}
                    required
                  />
                </div>
              </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Step2contractor;
