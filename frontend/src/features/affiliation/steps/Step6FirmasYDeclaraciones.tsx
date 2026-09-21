'use client';

import React, { useEffect } from 'react';
import { SignaturePad } from '../SignaturePad';
import {
  DeclaracionesFirmasSection,
  IntermediarioSection,
  PersonaNaturalData,
  contractorSection,
} from '@/core/interfaces/affiliation.interfaces';
import { ShieldCheck, FileCheck, Fingerprint, Award, Check } from 'lucide-react';

interface Step6Props {
  firmas: DeclaracionesFirmasSection;
  intermediario: IntermediarioSection;
  titular: PersonaNaturalData;
  contratante: contractorSection;
  suggestedPlace: string;
  onChangeFirmas: (firmas: DeclaracionesFirmasSection) => void;
  onChangeIntermediario: (intermediario: IntermediarioSection) => void;
}

export const Step6FirmasYDeclaraciones: React.FC<Step6Props> = ({
  firmas,
  intermediario,
  titular,
  contratante,
  suggestedPlace,
  onChangeFirmas,
  onChangeIntermediario,
}) => {
  useEffect(() => {
    if (!(firmas.lugar || '').trim() && suggestedPlace) {
      onChangeFirmas({ ...firmas, lugar: suggestedPlace });
    }
    // Solo completa un lugar vacío; una edición manual no se sobrescribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmas.lugar, suggestedPlace]);

  const updateFirmas = (fields: Partial<DeclaracionesFirmasSection>) => {
    onChangeFirmas({ ...firmas, ...fields });
  };

  const updateIntermediario = (fields: Partial<IntermediarioSection>) => {
    onChangeIntermediario({ ...intermediario, ...fields });
  };

  const nombreTitularCompleto = `${titular.nombres} ${titular.apellidos}`.trim() || 'EL PROPUESTO AFILIADO TITULAR';
  const nombreContratanteCompleto = contratante.esDiferente
    ? contratante.tipoPersona === 'Natural'
      ? `${contratante.personaNatural.nombres} ${contratante.personaNatural.apellidos}`.trim() || 'EL CONTRATANTE'
      : contratante.personaJuridica.razonSocial || 'LA EMPRESA CONTRATANTE'
    : nombreTitularCompleto;

  const cedulaContratante = contratante.esDiferente
    ? contratante.tipoPersona === 'Natural'
      ? `${contratante.personaNatural.tipoDoc}-${contratante.personaNatural.numDoc}`
      : `${contratante.personaJuridica.tipoRif}-${contratante.personaJuridica.numRif}`
    : `${titular.tipoDoc}-${titular.numDoc}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Grid: Términos y Firmas Electrónicas (como en la imagen de referencia) */}
      <div className="grid grid-cols-2 gap-6">
        {/* TÉRMINOS Y CONDICIONES SUDEASEG CON SCROLL */}
        <div className="previasis-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Términos y Condiciones Legales
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Providencia Administrativa Sudeaseg Nº SAA-09-1585
              </p>
            </div>
          </div>

          {/* Cuadro de Texto Legal con Scroll Interno */}
          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8125rem',
              color: 'var(--text-body)',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <p>
              <strong>1. Declaración de Veracidad del Titular:</strong> Al firmar, el solicitante <strong>{nombreTitularCompleto}</strong> (C.I. {titular.tipoDoc}-{titular.numDoc}) declara bajo fe de juramento la veracidad de los datos proporcionados y autoriza a <strong>PREVIASIS MEDICINA PREPAGADA S.A.</strong> a verificar su información ante las autoridades competentes y entidades de salud. La cobertura entrará en vigor tras la aprobación formal y el pago de la primera cuota, sujeto a los plazos establecidos en el contrato marco.
            </p>

            <p>
              <strong>2. Declaración de Origen Lícito de Fondos (Contratante):</strong> El contratante <strong>{nombreContratanteCompleto}</strong> (ID {cedulaContratante}) da fe de que el dinero utilizado para el pago de las cuotas proviene de una fuente lícita y de actividades económicas legítimas, de conformidad con la Ley Orgánica contra la Delincuencia Organizada y las normas de la Sudeaseg.
            </p>

            <p>
              <strong>3. Mensajes de Datos y Notificaciones:</strong> Se autoriza expresamente el envío de avisos de cobro, constancias y notificaciones electrónicas al correo y teléfonos registrados.
            </p>
          </div>

          {/* Checkbox de Aceptación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--previasis-dark-green)' }}>
              <input
                type="checkbox"
                style={{ marginTop: '0.15rem', accentColor: 'var(--previasis-green)' }}
                checked={firmas.aceptaDeclaracionTitular}
                onChange={(e) => updateFirmas({ aceptaDeclaracionTitular: e.target.checked })}
                required
              />
              <span>Acepto plenamente los Términos, Condiciones y Declaración del Titular *</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--previasis-dark-green)' }}>
              <input
                type="checkbox"
                style={{ marginTop: '0.15rem', accentColor: 'var(--previasis-green)' }}
                checked={firmas.aceptaOrigenFondosContratante}
                onChange={(e) => updateFirmas({ aceptaOrigenFondosContratante: e.target.checked })}
                required
              />
              <span>Doy fe del Origen Lícito de los Fondos del Contratante *</span>
            </label>
          </div>
        </div>

        {/* FIRMAS ELECTRÓNICAS (Derecha) */}
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
              <FileCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
                Firma Electrónica
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dibuje su firma con el dedo o el mouse
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="previasis-input-group">
              <label className="previasis-label">
                Lugar de Suscripción <span className="previasis-label-required">*</span>
              </label>
              <input
                type="text"
                className="previasis-input"
                value={firmas.lugar || suggestedPlace}
                onChange={(e) => updateFirmas({ lugar: e.target.value })}
                required
              />
            </div>
            <div className="previasis-input-group">
              <label className="previasis-label">
                Fecha de Suscripción <span className="previasis-label-required">*</span>
              </label>
              <input
                type="date"
                className="previasis-input"
                value={firmas.fecha}
                onChange={(e) => updateFirmas({ fecha: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Firma Titular */}
          <SignaturePad
            label={`Firma del Titular: ${nombreTitularCompleto}`}
            initialSignature={firmas.firmaTitularBase64}
            onSave={(b64) => updateFirmas({ firmaTitularBase64: b64 })}
            required
          />

          {/* Firma Contratante si es diferente */}
          {contratante.esDiferente && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              <SignaturePad
                label={`Firma del Contratante: ${nombreContratanteCompleto}`}
                initialSignature={firmas.firmaContratanteBase64}
                onSave={(b64) => updateFirmas({ firmaContratanteBase64: b64 })}
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* INTERMEDIARIO DE LA ACTIVIDAD ASEGURADORA */}
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
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--previasis-dark-green)' }}>
              Intermediario de la Actividad Aseguradora / Asesor Comercial
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Datos del consultor registrado ante Sudeaseg
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="previasis-input-group">
            <label className="previasis-label">
              Nombre y Apellido del Asesor <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Asesor de Ventas"
              value={intermediario.nombreApellido}
              onChange={(e) => updateIntermediario({ nombreApellido: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              Nº Credencial Sudeaseg <span className="previasis-label-required">*</span>
            </label>
            <input
              type="text"
              className="previasis-input"
              placeholder="Ej: CR-008899"
              value={intermediario.numCredencial}
              onChange={(e) => updateIntermediario({ numCredencial: e.target.value })}
              required
            />
          </div>

          <div className="previasis-input-group">
            <label className="previasis-label">
              C.I. / RIF del Asesor <span className="previasis-label-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="previasis-input"
                style={{ width: '85px', flex: '0 0 auto', fontWeight: 700 }}
                value={intermediario.tipoDoc}
                onChange={(e) => updateIntermediario({ tipoDoc: e.target.value as any })}
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="J">J-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                className="previasis-input"
                placeholder="12345678"
                value={intermediario.ciRifPasaporte}
                onChange={(e) => updateIntermediario({ ciRifPasaporte: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6FirmasYDeclaraciones;
