'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StepProgress, StepItem } from '@/features/affiliation/StepProgress';
import { Step1HeaderAndTitular } from '@/features/affiliation/steps/Step1HeaderAndTitular';
import { Step2contractor } from '@/features/affiliation/steps/Step2Contratante';
import { Step3AfiliadosPlan } from '@/features/affiliation/steps/Step3AfiliadosPlan';
import { Step4DeclaracionSalud } from '@/features/affiliation/steps/Step4DeclaracionSalud';
import { Step5PagoYOtros } from '@/features/affiliation/steps/Step5PagoYOtros';
import { Step6FirmasYDeclaraciones } from '@/features/affiliation/steps/Step6FirmasYDeclaraciones';
import { DocumentUploader, UploadedFileItem } from '@/features/affiliation/DocumentUploader';
import { PdfPreviewModal } from '@/features/affiliation/PdfPreviewModal';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import { SolicitudAfiliacionFormState } from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';
import { calculateActuarialAge } from '@/core/utils/age.utils';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Camera,
} from 'lucide-react';

const STEPS: StepItem[] = [
  { id: 1, title: 'Datos del Titular y Control', shortTitle: '1. Titular', description: 'Identificación y datos del proponente titular' },
  { id: 2, title: 'Datos del Contratante', shortTitle: '2. Contratante', description: 'Persona natural responsable del pago' },
  { id: 3, title: 'Grupo Familiar y Planes', shortTitle: '3. Planes', description: 'Selección de planes y familiares' },
  { id: 4, title: 'Declaración de Salud', shortTitle: '4. Salud', description: 'Cuestionario médico de 26 preguntas' },
  { id: 5, title: 'Forma de Pago', shortTitle: '5. Pagos y Soportes', description: 'Frecuencia de pago y fotos/PDF' },
  { id: 6, title: 'Firmas y Declaraciones', shortTitle: '6. Firmas', description: 'Textos legales Sudeaseg y firma digital' },
];

const INITIAL_STATE: SolicitudAfiliacionFormState = {
  header: {
    tipoOperacion: 'Emisión',
    tipoContrato: 'Individual',
    numSolicitud: '',
    fechaSolicitud: new Date().toISOString().slice(0, 10),
  },
  titular: {
    nombres: '',
    apellidos: '',
    tipoDoc: 'V',
    numDoc: '',
    tipoRif: 'V',
    numRif: '',
    nacionalidad: 'Venezolana',
    estadoCivil: 'Soltero(a)',
    sexo: 'M',
    lugarNacimiento: '',
    fechaNacimiento: '',
    profesion: '',
    ocupacion: '',
    ramoComercial: '',
    ingresoAnualBs: '',
    pep: 'NO',
    pepDescripcion: '',
    clasificacionActividad: 'Dependiente',
    direccionHabitacion: '',
    direccionOficina: '',
    direccionCobro: 'Habitación',
    telefonoHabitacion: '',
    telefonoMovil: '',
    email: '',
  },
  contratante: {
    esDiferente: false,
    tipoPersona: 'Natural',
    personaNatural: {
      nombres: '',
      apellidos: '',
      tipoDoc: 'V',
      numDoc: '',
      tipoRif: 'V',
      numRif: '',
      nacionalidad: 'Venezolana',
      estadoCivil: 'Soltero(a)',
      sexo: 'M',
      lugarNacimiento: '',
      fechaNacimiento: '',
      profesion: '',
      ocupacion: '',
      ramoComercial: '',
      ingresoAnualBs: '',
      pep: 'NO',
      pepDescripcion: '',
      clasificacionActividad: 'Dependiente',
      direccionHabitacion: '',
      direccionOficina: '',
      direccionCobro: '',
      telefonoHabitacion: '',
      telefonoMovil: '',
      email: '',
    },
    personaJuridica: {
      razonSocial: '',
      tipoRif: 'J',
      numRif: '',
      numRegistroMercantil: '',
      numTomo: '',
      fechaRegistro: '',
      actividadEconomica: 'Comercial',
      ramoComercial: '',
      productosServicios: '',
      direccionFiscal: '',
      telefono: '',
      utilidadEjercicioAnterior: '',
      patrimonioNeto: '',
      representanteLegal: {
        nombres: '',
        apellidos: '',
        tipoDoc: 'V',
        numDoc: '',
        tipoRif: 'V',
        numRif: '',
        nacionalidad: 'Venezolana',
        estadoCivil: 'Casado(a)',
        sexo: 'M',
        lugarNacimiento: '',
        fechaNacimiento: '',
        profesion: 'Director General',
        ocupacion: 'Ejecutivo',
        ingresoAnualBs: '',
        pep: 'NO',
        clasificacionActividad: 'Societaria',
        direccionHabitacion: '',
        direccionOficina: '',
        direccionCobro: '',
        telefonoHabitacion: '',
        telefonoMovil: '',
        email: '',
      },
    },
  },
  afiliados: [
    {
      id: 'titular_row',
      codigoAfiliado: 1,
      nombreCompleto: '',
      tipoDoc: 'V',
      numDoc: '',
      fechaNacimiento: '',
      parentesco: 'Titular',
      sexo: 'M',
      pesoKg: '',
      estaturaCm: '',
      planSolicitado: 'Plan Oro',
      limiteCobertura: '$25.000',
      cuota:0
    },
  ],
  salud: {
    preguntas: {},
    detallesDeportivos: [],
    detallesAclaracion: {},
    afeccionesDetalles: [],
  },
  pago: {
    frecuenciaPago: 'Mensual',
    moneda: 'Dólares',
    modalidadPago: 'Pago en Oficina',
  },
  firmas: {
    lugar: 'Caracas, Dto. Capital',
    fecha: new Date().toISOString().slice(0, 10),
    firmaTitularBase64: null,
    firmaContratanteBase64: null,
    aceptaDeclaracionTitular: false,
    aceptaOrigenFondosContratante: false,
  },
  intermediario: {
    nombreApellido: '',
    numCredencial: '',
    tipoDoc: 'V',
    ciRifPasaporte: '',
  },
  documentosAdjuntos: [],
};

const STORAGE_KEY = 'previasis_afiliacion_draft_v2';

type LegacyAntecedent = {
  tiene?: 'SÍ' | 'NO';
  numContrato?: string;
  nombreCompania?: string;
  tipoSeguro?: string;
};

type LegacyPago = SolicitudAfiliacionFormState['pago'] & {
  otrosContratos?: LegacyAntecedent;
  negativaPrevia?: LegacyAntecedent;
};

export default function AfiliacionPage() {
  //State management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<SolicitudAfiliacionFormState>(INITIAL_STATE);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [savedAlert, setSavedAlert] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SolicitudAfiliacionFormState & { pago: LegacyPago };
        const salud = parsed.salud || {
          preguntas: {},
          detallesDeportivos: [],
          detallesAclaracion: {},
          afeccionesDetalles: [],
        };
        const preguntas = { ...salud.preguntas };
        const legacyPago = (parsed.pago || {}) as LegacyPago;
        const otrosContratos = legacyPago.otrosContratos;
        const negativaPrevia = legacyPago.negativaPrevia;

        if (otrosContratos && !preguntas[25]) {
          preguntas[25] = {
            respuesta: otrosContratos.tiene === 'SÍ' ? 'SÍ' : 'NO',
            ...(otrosContratos.numContrato || otrosContratos.nombreCompania
              ? {
                  detalleAntecedente: {
                    campo1: otrosContratos.numContrato || '',
                    campo2: otrosContratos.nombreCompania || '',
                  },
                }
              : {}),
          };
        }

        if (negativaPrevia && !preguntas[26]) {
          preguntas[26] = {
            respuesta: negativaPrevia.tiene === 'SÍ' ? 'SÍ' : 'NO',
            ...(negativaPrevia.tipoSeguro || negativaPrevia.nombreCompania
              ? {
                  detalleAntecedente: {
                    campo1: negativaPrevia.tipoSeguro || '',
                    campo2: negativaPrevia.nombreCompania || '',
                  },
                }
              : {}),
          };
        }

        const pago = { ...legacyPago } as LegacyPago;
        delete pago.otrosContratos;
        delete pago.negativaPrevia;

        setFormData({
          ...parsed,
          salud: {
            ...salud,
            preguntas,
          },
          pago: pago as SolicitudAfiliacionFormState['pago'],
          contratante: {
            ...parsed.contratante,
            tipoPersona: 'Natural',
          },
        });
      }
    } catch (e) {
      console.error('Error cargando borrador:', e);
    }
  }, []);
  
  //guarda la informacion en localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2000);
    } catch (e) {
      console.error('Error guardando borrador:', e);
    }
  }, [formData]);


  // Keep Titular and Afiliado #1 in sync
  useEffect(() => {
    if (formData.titular.nombres || formData.titular.apellidos) {
      const full = `${formData.titular.nombres} ${formData.titular.apellidos}`.trim();
      setFormData((prev) => {
        const updatedAfiliados = [...prev.afiliados];
        if (updatedAfiliados.length > 0) {
          updatedAfiliados[0] = {
            ...updatedAfiliados[0],
            nombreCompleto: full || updatedAfiliados[0].nombreCompleto,
            numDoc: prev.titular.numDoc || updatedAfiliados[0].numDoc,
            tipoDoc: prev.titular.tipoDoc,
            fechaNacimiento: prev.titular.fechaNacimiento || updatedAfiliados[0].fechaNacimiento,
            sexo: prev.titular.sexo,
          };
        }
        return { ...prev, afiliados: updatedAfiliados };
      });
    }
  }, [
    formData.titular.nombres,
    formData.titular.apellidos,
    formData.titular.numDoc,
    formData.titular.tipoDoc,
    formData.titular.fechaNacimiento,
    formData.titular.sexo,
  ]);

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const t = formData.titular;
      if (!t.nombres || !t.apellidos || !t.numDoc || !t.numRif || !t.fechaNacimiento || !t.telefonoMovil || !t.email) {
        alert('Por favor complete los campos obligatorios del Titular.');
        return false;
      }
    }
    if (step === 2 && formData.contratante.esDiferente) {
      const c = formData.contratante.personaNatural;
      if (!c.nombres || !c.apellidos || !c.numDoc) {
        alert('Por favor complete los datos obligatorios del Contratante.');
        return false;
      }
    }
    if (step === 3) {
      if (formData.afiliados.length === 0 || !formData.afiliados[0].nombreCompleto || !formData.afiliados[0].numDoc) {
        alert('Debe completar al menos los datos del Titular en el grupo familiar.');
        return false;
      }

      if (formData.afiliados.some((afiliado) => {
        const age = calculateActuarialAge(afiliado.fechaNacimiento);
        return age === null || age > 80;
      })) {
        alert('No se puede continuar: ningún beneficiario puede ser mayor de 80 años.');
        return false;
      }
    }
    if (step === 6) {
      if (!formData.firmas.firmaTitularBase64) {
        alert('La firma digital del Titular es obligatoria.');
        return false;
      }
      if (!formData.firmas.aceptaDeclaracionTitular) {
        alert('Debe marcar la casilla de aceptación de la Declaración del Titular.');
        return false;
      }
    }
    if (step === 4) {
      const preguntas = formData.salud.preguntas;
      const beneficiaryDetailIds = HEALTH_QUESTIONS
        .filter((q) => q.beneficiaryDetail)
        .map((q) => q.id);

      for (const [id, pregunta] of Object.entries(preguntas)) {
        if (
          pregunta.respuesta === 'SÍ' &&
          beneficiaryDetailIds.includes(Number(id)) &&
          (!pregunta.codigosAfiliados || pregunta.codigosAfiliados.length === 0)
        ) {
          const qTitle = HEALTH_QUESTIONS.find((q) => q.id === Number(id))?.title || `Pregunta ${id}`;
          alert(`Debe seleccionar al menos un beneficiario para: ${qTitle}`);
          return false;
        }
      }
      if (preguntas[17]?.respuesta === 'SÍ') {
        const detalles = formData.salud.detallesDeportivos || [];
        const codigosSeleccionados = preguntas[17].codigosAfiliados || [];
        for (const codigo of codigosSeleccionados) {
          const detalle = detalles.find((d) => d.codigoAfiliado === codigo);
          if (!detalle || !detalle.deporte.trim() || !detalle.frecuencia.trim() || !detalle.nivel) {
            alert('Debe completar deporte, frecuencia y nivel para cada beneficiario en Práctica Deportiva.');
            return false;
          }
        }
      }

      const aclaracionQuestionIds = HEALTH_QUESTIONS
        .filter((q) => q.beneficiaryDetail && q.id !== 17)
        .map((q) => q.id);

      for (const qid of aclaracionQuestionIds) {
        const pregunta = preguntas[qid];
        if (!pregunta || pregunta.respuesta !== 'SÍ') continue;
        const codigos = pregunta.codigosAfiliados || [];
        if (codigos.length === 0) continue;
        const detalles = formData.salud.detallesAclaracion?.[qid] || [];
        if (detalles.length === 0) {
          const qTitle = HEALTH_QUESTIONS.find((q) => q.id === qid)?.title || `Pregunta ${qid}`;
          alert(`Debe completar los campos de aclaración para cada beneficiario en: ${qTitle}`);
          return false;
        }
        const allCodigosHaveDetalle = codigos.every((c) =>
          detalles.some((d) => d.codigoAfiliado === c)
        );
        if (!allCodigosHaveDetalle) {
          const qTitle = HEALTH_QUESTIONS.find((q) => q.id === qid)?.title || `Pregunta ${qid}`;
          alert(`Debe completar los campos de aclaración para cada beneficiario en: ${qTitle}`);
          return false;
        }
        for (const dt of detalles) {
          if (!dt.campo1.trim() || !dt.campo2.trim()) {
            const qTitle = HEALTH_QUESTIONS.find((q) => q.id === qid)?.title || `Pregunta ${qid}`;
            alert(`Debe completar los campos de aclaración para cada beneficiario en: ${qTitle}`);
            return false;
          }
        }
       }
     }
     if (step === 5) {
       if (!formData.pago.frecuenciaPago) {
         alert('Seleccione una frecuencia de pago.');
         return false;
       }
       if (!formData.pago.modalidadPago) {
         alert('Seleccione una modalidad de pago.');
         return false;
       }
       if (formData.pago.modalidadPago === 'Otro' && !formData.pago.especifiqueOtroPago) {
         alert('Especifique la otra modalidad de pago.');
         return false;
       }
     }
     return true;
   };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    saveDraft();
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowPreviewModal(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoadSampleData = () => {
    setFormData({
      header: {
        tipoOperacion: 'Emisión',
        tipoContrato: 'Individual',
        numSolicitud: 'SOL-2026-0089',
        fechaSolicitud: new Date().toISOString().slice(0, 10),
      },
      titular: {
        nombres: 'Carlos Andrés',
        apellidos: 'Mendoza Ruiz',
        tipoDoc: 'V',
        numDoc: '18456789',
        tipoRif: 'V',
        numRif: '18456789-0',
        nacionalidad: 'Venezolana',
        estadoCivil: 'Casado(a)',
        sexo: 'M',
        lugarNacimiento: 'Barquisimeto, Lara, Venezuela',
        fechaNacimiento: '1988-04-12',
        profesion: 'Ingeniero Civil',
        ocupacion: 'Consultor de Obras',
        ingresoAnualBs: '$ 4.200,00',
        pep: 'NO',
        pepDescripcion: '',
        clasificacionActividad: 'Independiente',
        direccionHabitacion: 'Av. Pedro León Torres, Res. París, Apto 5-A, Barquisimeto, Lara',
        direccionOficina: 'Edificio Centro Empresarial, Piso 4, Barquisimeto',
        direccionCobro: 'Habitación',
        telefonoHabitacion: '0251-2521199',
        telefonoMovil: '0414-5231144',
        email: 'carlos.mendoza@previasis.com',
      },
      contratante: {
        esDiferente: false,
        tipoPersona: 'Natural',
        personaNatural: { ...INITIAL_STATE.contratante.personaNatural },
        personaJuridica: { ...INITIAL_STATE.contratante.personaJuridica },
      },
      afiliados: [
        {
          id: '1',
          codigoAfiliado: 1,
          nombreCompleto: 'Carlos Andrés Mendoza Ruiz',
          tipoDoc: 'V',
          numDoc: '18456789',
          fechaNacimiento: '1988-04-12',
          parentesco: 'Titular',
          sexo: 'M',
          pesoKg: '78',
          estaturaCm: '178',
          planSolicitado: 'Plan Oro',
          limiteCobertura: '$25.000',
          cuota:0
        },
        {
          id: '2',
          codigoAfiliado: 2,
          nombreCompleto: 'María Elena Mendoza',
          tipoDoc: 'V',
          numDoc: '19334455',
          fechaNacimiento: '1990-08-15',
          parentesco: 'Cónyuge',
          sexo: 'F',
          pesoKg: '60',
          estaturaCm: '165',
          planSolicitado: 'Plan Oro',
          limiteCobertura: '$25.000',
          cuota:0
        },
        {
          id: '3',
          codigoAfiliado: 3,
          nombreCompleto: 'Lucas Daniel Mendoza',
          tipoDoc: 'V',
          numDoc: '34112233',
          fechaNacimiento: '2017-06-20',
          parentesco: 'Hijo/a',
          sexo: 'M',
          pesoKg: '28',
          estaturaCm: '128',
          planSolicitado: 'Plan Plata',
          limiteCobertura: '$15.000',
          cuota:0
        },
      ],
      salud: {
        preguntas: {
          1: { respuesta: 'NO' },
          2: { respuesta: 'NO' },
          3: { respuesta: 'SÍ', detallesExtra: 'Miopía leve (lentes correctivos)' },
          4: { respuesta: 'NO' },
          5: { respuesta: 'NO' },
          6: { respuesta: 'NO' },
          7: { respuesta: 'NO' },
          8: { respuesta: 'NO' },
          9: { respuesta: 'NO' },
          10: { respuesta: 'NO' },
          11: { respuesta: 'NO' },
          12: { respuesta: 'NO' },
          13: { respuesta: 'NO' },
          14: { respuesta: 'NO' },
          15: { respuesta: 'SÍ', detallesExtra: '1 embarazo a término sin complicaciones' },
          16: { respuesta: 'NO' },
          17: { respuesta: 'SÍ', codigosAfiliados: [1], detallesExtra: 'Ciclismo de ruta 2 veces por semana' },
          18: { respuesta: 'NO' },
          19: { respuesta: 'NO' },
          20: { respuesta: 'NO' },
          21: { respuesta: 'NO' },
          22: { respuesta: 'NO' },
          23: { respuesta: 'NO' },
          24: { respuesta: 'NO' },
        },
        detallesDeportivos: [
          { codigoAfiliado: 1, deporte: 'Ciclismo de ruta', frecuencia: '2 veces por semana', nivel: 'Amateur' },
        ],
        detallesAclaracion: {},
        afeccionesDetalles: [
          {
            id: 'af1',
            codigoAfiliado: 1,
            padecimiento: 'Defecto de refracción visual (Miopía)',
            fechaDiagnostico: '05/2020',
            tratamientoPracticado: 'Lentes de corrección visual',
            fechaUltimoChequeo: '2025-11-10',
            institucionHospitalaria: 'Clínica Acosta Ortiz, Barquisimeto',
          },
        ],
      },
      pago: {
        frecuenciaPago: 'Anual',
        moneda: 'Dólares',
        modalidadPago: 'Pago en Oficina',
      },
      firmas: {
        lugar: 'Barquisimeto, Edo. Lara',
        fecha: new Date().toISOString().slice(0, 10),
        firmaTitularBase64: null,
        firmaContratanteBase64: null,
        aceptaDeclaracionTitular: true,
        aceptaOrigenFondosContratante: true,
      },
      intermediario: {
        nombreApellido: 'Mariángel Colmenárez',
        numCredencial: 'CR-007744',
        tipoDoc: 'V',
        ciRifPasaporte: '15889922',
      },
      documentosAdjuntos: [],
    });
    setCompletedSteps([1, 2, 3, 4, 5]);
    alert('¡Datos de demostración cargados exitosamente!');
  };

  const handleReset = () => {
    if (confirm('¿Deseas reiniciar todos los campos del formulario?')) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(INITIAL_STATE);
      setCompletedSteps([]);
      setCurrentStep(1);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', paddingBottom: '6rem' }}>
      <style suppressHydrationWarning>{`
        .afiliacion-hero {
          background: var(--grad-hero);
          padding: 2.5rem 1.5rem 3.5rem 1.5rem;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-floating);
        }
        .afiliacion-hero-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          position: relative;
          z-index: 10;
        }
        .afiliacion-hero-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .afiliacion-hero-logo {
          background-color: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          padding: 0.6rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .afiliacion-hero-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .afiliacion-hero-action-btn {
          background-color: rgba(255,255,255,0.15);
          color: #ffffff;
          border-color: rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
        }
        .afiliacion-content {
          margin-top: -1.5rem;
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .afiliacion-bottom-bar {
          position: fixed;
          bottom: 1rem;
          left: 0;
          right: 0;
          z-index: 40;
        }
        .afiliacion-bottom-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-card);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }
        .afiliacion-bottom-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--previasis-dark-green);
        }

        @media (max-width: 768px) {
          .afiliacion-hero {
            padding: 1.5rem 1rem 2.5rem 1rem;
          }
          .afiliacion-hero-brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .afiliacion-hero-logo {
            display: none;
          }
          .afiliacion-hero-actions {
            width: 100%;
          }
          .afiliacion-hero-action-btn {
            flex: 1;
            min-width: 0;
            justify-content: center;
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
          }
          .afiliacion-content {
            margin-top: -1rem;
            gap: 1.25rem;
          }
          .afiliacion-bottom-bar {
            bottom: 0.5rem;
          }
          .afiliacion-bottom-inner {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-lg);
            gap: 0.5rem;
          }
          .afiliacion-bottom-step {
            font-size: 0.6875rem;
          }
        }

        @media (max-width: 480px) {
          .afiliacion-hero {
            padding: 1.25rem 0.75rem 2rem 0.75rem;
          }
          .afiliacion-hero h1 {
            font-size: 1.25rem !important;
          }
          .afiliacion-hero-actions {
            gap: 0.375rem;
          }
          .afiliacion-bottom-inner {
            padding: 0.625rem 0.75rem;
          }
        }
      `}</style>
      {/* HERO BANNER EN AZUL CORPORATIVO PROFUNDO CON ONDA VERDE LIMA */}
      <div className="afiliacion-hero">
        <div className="container afiliacion-hero-inner">
          <div className="afiliacion-hero-brand">
            <div className="afiliacion-hero-logo">
              <PreviasisLogo size={42} showText={false} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="pill-badge" style={{ backgroundColor: 'rgba(132, 204, 22, 0.2)', color: '#84CC16', borderColor: 'rgba(132, 204, 22, 0.4)' }}>
                  <ShieldCheck size={13} /> Sudeaseg Providencia Nº SAA-09-1585
                </span>
                {savedAlert && (
                  <span className="pill-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                    Guardado
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Solicitud de Afiliación
              </h1>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                PREVIASIS MEDICINA PREPAGADA S.A. • RIF J-412048970 •
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="afiliacion-hero-actions">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="btn-pill btn-pill-secondary afiliacion-hero-action-btn"
            >
              <Sparkles size={14} color="#84CC16" /> Cargar Ejemplo
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="btn-pill btn-pill-secondary afiliacion-hero-action-btn"
            >
              <Save size={14} /> Guardar borrador
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-pill btn-pill-secondary afiliacion-hero-action-btn"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Línea Decorativa Onda Verde Lima (ECG Wave) */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div className="ecg-line" />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL FLUIDO */}
      <div className="container afiliacion-content">
        {/* Stepper Progress */}
        <div className="previasis-card" style={{ padding: '1.25rem 1.5rem' }}>
          <StepProgress
            steps={STEPS}
            currentStep={currentStep}
            onSelectStep={(step) => {
              if (step <= currentStep || completedSteps.includes(step)) {
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Contents */}
        <div>
          {currentStep === 1 && (
            <Step1HeaderAndTitular
              header={formData.header}
              titular={formData.titular}
              onChangeHeader={(header) => setFormData({ ...formData, header })}
              onChangeTitular={(titular) => setFormData({ ...formData, titular })}
            />
          )}

          {currentStep === 2 && (
            <Step2contractor
              contractor={formData.contratante}
              onChangeContractor={(contratante) => setFormData({
                ...formData,
                contratante: { ...contratante, tipoPersona: 'Natural' },
              })}
            />
          )}

          {currentStep === 3 && (
            <Step3AfiliadosPlan
              afiliados={formData.afiliados}
              onChangeAfiliados={(afiliados) => setFormData({ ...formData, afiliados })}
              titularNombreCompleto={`${formData.titular.nombres} ${formData.titular.apellidos}`}
              titularDoc={formData.titular.numDoc}
            />
          )}

          {currentStep === 4 && (
            <Step4DeclaracionSalud
              salud={formData.salud}
              afiliados={formData.afiliados}
              onChangeSalud={(salud) => setFormData({ ...formData, salud })}
            />
          )}

          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Step5PagoYOtros
                pago={formData.pago}
                onChangePago={(pago) => setFormData({ ...formData, pago })}
              />

              {/* <div className="previasis-card">
                <DocumentUploader
                  documents={formData.documentosAdjuntos || []}
                  onAddDocument={(doc) => setFormData({
                    ...formData,
                    documentosAdjuntos: [...(formData.documentosAdjuntos || []), doc],
                  })}
                  onRemoveDocument={(id) => setFormData({
                    ...formData,
                    documentosAdjuntos: (formData.documentosAdjuntos || []).filter((d) => d.id !== id),
                  })}
                />
              </div> */}
            </div>
          )}

          {currentStep === 6 && (
            <Step6FirmasYDeclaraciones
              firmas={formData.firmas}
              intermediario={formData.intermediario}
              titular={formData.titular}
              contratante={formData.contratante}
              onChangeFirmas={(firmas) => setFormData({ ...formData, firmas })}
              onChangeIntermediario={(intermediario) => setFormData({ ...formData, intermediario })}
            />
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM ACTION BAR */}
      <div className="afiliacion-bottom-bar">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="afiliacion-bottom-inner">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="btn-pill btn-pill-secondary"
            >
              <ArrowLeft size={16} /> Anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={saveDraft}
                className="btn-pill btn-pill-secondary"
                style={{ display: 'none' }}
              >
                <Save size={14} /> Guardar
              </button>

              <span className="afiliacion-bottom-step">
                Paso {currentStep} de {STEPS.length}
              </span>
            </div>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-pill btn-pill-primary"
              >
                Siguiente Paso <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="btn-pill btn-pill-primary"
                style={{ backgroundColor: 'var(--previasis-green)', boxShadow: '0 4px 16px var(--previasis-green-glow)' }}
              >
                <Send size={16} /> Enviar solicitud / Generar PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        formData={formData}
      />
    </div>
  );
}
