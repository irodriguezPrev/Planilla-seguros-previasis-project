'use client';

import { useState, useEffect, useCallback } from 'react';
import { StepProgress, StepItem } from '@/features/affiliation/StepProgress';
import { Step1HeaderAndTitular } from '@/features/affiliation/steps/Step1HeaderAndTitular';
import { Step2contractor } from '@/features/affiliation/steps/Step2Contratante';
import { Step3AfiliadosPlan } from '@/features/affiliation/steps/Step3AfiliadosPlan';
import { Step4DeclaracionSalud } from '@/features/affiliation/steps/Step4DeclaracionSalud';
import { Step5PagoYOtros } from '@/features/affiliation/steps/Step5PagoYOtros';
import { Step6FirmasYDeclaraciones } from '@/features/affiliation/steps/Step6FirmasYDeclaraciones';
import { PdfPreviewModal } from '@/features/affiliation/PdfPreviewModal';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import {
  AfiliadoRow,
  DeclaracionSaludSection,
  SolicitudAfiliacionFormState,
} from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';
import { getCitiesByState } from '@/core/config/venezuela-locations.config';
import { calculateActuarialAge } from '@/core/utils/age.utils';
import { getQuestionStatus } from '@/core/utils/health-progress.utils';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText,
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
    estadoResidencia: '',
    ciudadResidencia: '',
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

type PreviewMode = 'draft' | 'final';

const getApprovalSnapshot = (data: SolicitudAfiliacionFormState): string => JSON.stringify({
  header: data.header,
  titular: data.titular,
  contratante: data.contratante,
  afiliados: data.afiliados,
  salud: data.salud,
  pago: data.pago,
  intermediario: data.intermediario,
});

const uppercaseName = (value: string | undefined) =>
  (value || '').toLocaleUpperCase('es-VE'); //#TODO mover a helpers 

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Applies only the fields changed by a child component over the latest state.
 * This prevents rapid mobile events from restoring values from an older render.
 */
const mergeChangedValues = <T,>(latest: T, rendered: T, proposed: T): T => {
  if (Object.is(rendered, proposed)) return latest;

  if (Array.isArray(rendered) && Array.isArray(proposed) && Array.isArray(latest)) {
    if (rendered.length !== proposed.length || latest.length !== rendered.length) return proposed as T;

    const sameItems = proposed.every((item, index) => {
      const renderedItem = rendered[index];
      if (!isRecord(item) || !isRecord(renderedItem)) return true;
      const itemKey = item.id ?? item.codigoAfiliado;
      const renderedKey = renderedItem.id ?? renderedItem.codigoAfiliado;
      return itemKey === undefined || renderedKey === undefined || itemKey === renderedKey;
    });
    if (!sameItems) return proposed as T;

    return proposed.map((item, index) =>
      mergeChangedValues(latest[index], rendered[index], item),
    ) as T;
  }

  if (isRecord(rendered) && isRecord(proposed) && isRecord(latest)) {
    const merged: Record<string, unknown> = { ...latest };
    Object.keys(proposed).forEach((key) => {
      merged[key] = mergeChangedValues(latest[key], rendered[key], proposed[key]);
    });
    return merged as T;
  }

  return proposed;
};

const normalizeFormNames = (
  data: SolicitudAfiliacionFormState,
): SolicitudAfiliacionFormState => ({
  ...data,
  titular: {
    ...data.titular,
    nombres: uppercaseName(data.titular.nombres),
    apellidos: uppercaseName(data.titular.apellidos),
  },
  contratante: {
    ...data.contratante,
    personaNatural: {
      ...data.contratante.personaNatural,
      nombres: uppercaseName(data.contratante.personaNatural.nombres),
      apellidos: uppercaseName(data.contratante.personaNatural.apellidos),
    },
    personaJuridica: {
      ...data.contratante.personaJuridica,
      representanteLegal: {
        ...data.contratante.personaJuridica.representanteLegal,
        nombres: uppercaseName(data.contratante.personaJuridica.representanteLegal.nombres),
        apellidos: uppercaseName(data.contratante.personaJuridica.representanteLegal.apellidos),
      },
    },
  },
  afiliados: data.afiliados.map((afiliado) => ({
    ...afiliado,
    nombreCompleto: uppercaseName(afiliado.nombreCompleto),
  })),
  intermediario: {
    ...data.intermediario,
    nombreApellido: uppercaseName(data.intermediario.nombreApellido),
  },
});

const reconcileAffiliateHealthData = (
  salud: DeclaracionSaludSection,
  previousAffiliates: AfiliadoRow[],
  nextAffiliates: AfiliadoRow[],
): DeclaracionSaludSection => {
  const previousCodeById = new Map(
    previousAffiliates.map((afiliado) => [afiliado.id, afiliado.codigoAfiliado]),
  );
  const codeMap = new Map<number, number>();

  nextAffiliates.forEach((afiliado) => {
    const previousCode = previousCodeById.get(afiliado.id);
    if (previousCode !== undefined) codeMap.set(previousCode, afiliado.codigoAfiliado);
  });

  const remapRecord = <T,>(record?: Partial<Record<number, T>>) => {
    if (!record) return undefined;
    const remapped: Partial<Record<number, T>> = {};
    Object.entries(record).forEach(([rawCode, value]) => {
      const nextCode = codeMap.get(Number(rawCode));
      if (nextCode !== undefined && value !== undefined) remapped[nextCode] = value;
    });
    return remapped;
  };

  const preguntas = Object.fromEntries(
    Object.entries(salud.preguntas).map(([questionId, state]) => {
      const hasAffiliateData =
        state.respuestasAfiliados !== undefined ||
        state.detallesExtraPorAfiliado !== undefined ||
        state.codigosAfiliados !== undefined;

      if (!hasAffiliateData) return [questionId, state];

      const respuestasAfiliados = remapRecord(state.respuestasAfiliados);
      const detallesExtraPorAfiliado = remapRecord(state.detallesExtraPorAfiliado);
      const mappedSelectedCodes = (state.codigosAfiliados || [])
        .map((code) => codeMap.get(code))
        .filter((code): code is number => code !== undefined);
      const affirmativeCodes = Object.entries(respuestasAfiliados || {})
        .filter(([, answer]) => answer === 'SÍ')
        .map(([code]) => Number(code));
      const codigosAfiliados = Array.from(new Set([
        ...mappedSelectedCodes,
        ...affirmativeCodes,
      ])).sort((a, b) => a - b);
      const detallesExtra = Object.entries(detallesExtraPorAfiliado || {})
        .filter(([, value]) => value?.trim())
        .map(([code, value]) => `#${code}: ${value}`)
        .join(' | ');

      return [questionId, {
        ...state,
        respuesta: codigosAfiliados.length > 0 ? 'SÍ' as const : 'NO' as const,
        respuestasAfiliados,
        detallesExtraPorAfiliado,
        codigosAfiliados,
        detallesExtra: detallesExtra || undefined,
      }];
    }),
  ) as DeclaracionSaludSection['preguntas'];

  return {
    ...salud,
    preguntas,
    afeccionesDetalles: salud.afeccionesDetalles
      .filter((detail) => codeMap.has(Number(detail.codigoAfiliado)))
      .map((detail) => ({
        ...detail,
        codigoAfiliado: codeMap.get(Number(detail.codigoAfiliado))!,
      })),
    detallesDeportivos: (salud.detallesDeportivos || [])
      .filter((detail) => codeMap.has(detail.codigoAfiliado))
      .map((detail) => ({
        ...detail,
        codigoAfiliado: codeMap.get(detail.codigoAfiliado)!,
      })),
    detallesAclaracion: Object.fromEntries(
      Object.entries(salud.detallesAclaracion || {}).map(([questionId, details]) => [
        questionId,
        details
          .filter((detail) => codeMap.has(detail.codigoAfiliado))
          .map((detail) => ({
            ...detail,
            codigoAfiliado: codeMap.get(detail.codigoAfiliado)!,
          })),
      ]),
    ),
  };
};

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
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<SolicitudAfiliacionFormState>(INITIAL_STATE);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('draft');
  const [approvalSnapshot, setApprovalSnapshot] = useState<string | null>(null);
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

        const pago = { ...legacyPago, otrosContratos: '' };
        delete pago.negativaPrevia;

        setFormData(normalizeFormNames({
          ...parsed,
          salud: {
            ...salud,
            preguntas,
            afeccionesDetalles: (salud.afeccionesDetalles || [])
              .filter((detail) => {
                const padecimiento = detail.padecimiento.trim().toLocaleLowerCase('es-VE');
                return !(
                  detail.preguntaId === 6 &&
                  (padecimiento === 'y otros similares' || padecimiento === 'otros similares')
                );
              })
              .map((detail) =>
                detail.padecimiento.trim().toLocaleLowerCase('es-VE') === 'presbicia o similares'
                  ? { ...detail, padecimiento: 'Presbicia' }
                  : detail,
              ),
          },
          pago: pago as SolicitudAfiliacionFormState['pago'],
          contratante: {
            ...parsed.contratante,
            tipoPersona: 'Natural',
          },
        }));
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

  const handleAfiliadosChange = (nextAffiliates: AfiliadoRow[]) => {
    const normalizedAffiliates = nextAffiliates.map((afiliado) => ({
      ...afiliado,
      nombreCompleto: uppercaseName(afiliado.nombreCompleto),
    }));
    const compositionChanged =
      formData.afiliados.length !== normalizedAffiliates.length ||
      formData.afiliados.some((afiliado, index) => afiliado.id !== normalizedAffiliates[index]?.id);

    if (compositionChanged) {
      setCompletedSteps((steps) => steps.filter((step) => step < 4));
    }

    setFormData((previous) => {
      const mergedAffiliates = mergeChangedValues(
        previous.afiliados,
        formData.afiliados,
        normalizedAffiliates,
      );
      return {
        ...previous,
        afiliados: mergedAffiliates,
        salud: reconcileAffiliateHealthData(
          previous.salud,
          previous.afiliados,
          mergedAffiliates,
        ),
      };
    });
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const t = formData.titular;
      const validCities = getCitiesByState(t.estadoResidencia);
      if (
        !t.nombres ||
        !t.apellidos ||
        !t.numDoc ||
        !t.numRif ||
        !t.fechaNacimiento ||
        !t.estadoResidencia ||
        !t.ciudadResidencia ||
        !validCities.includes(t.ciudadResidencia) ||
        !t.telefonoMovil ||
        !t.email
      ) {
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
      if (!formData.firmas.aceptaDeclaracionTitular) {
        alert('Debe marcar la casilla de aceptación de la Declaración del Titular.');
        return false;
      }
      if (!formData.firmas.aceptaOrigenFondosContratante) {
        alert('Debe marcar la casilla de aceptación del Origen Lícito de los Fondos del Contratante.');
        return false;
      }
      if (!formData.firmas.firmaTitularBase64) {
        alert('La firma digital del Titular es obligatoria.');
        return false;
      }
      if (formData.contratante.esDiferente && !formData.firmas.firmaContratanteBase64) {
        alert('La firma digital del Contratante es obligatoria.');
        return false;
      }
      if (!formData.firmas.lugar || !formData.firmas.fecha) {
        alert('Complete el lugar y la fecha de suscripción.');
        return false;
      }
      const intermediary = formData.intermediario;
      if (
        !intermediary.nombreApellido ||
        !intermediary.numCredencial ||
        !intermediary.ciRifPasaporte
      ) {
        alert('Complete los datos obligatorios del intermediario.');
        return false;
      }
    }
    if (step === 4) {
      const firstIncompleteQuestion = HEALTH_QUESTIONS.find(
        (question) => getQuestionStatus(formData.salud, question, formData.afiliados) !== 'complete',
      );
      if (firstIncompleteQuestion) {
        const status = getQuestionStatus(formData.salud, firstIncompleteQuestion, formData.afiliados);
        alert(
          status === 'pending'
            ? `Debe responder la pregunta ${firstIncompleteQuestion.id}: ${firstIncompleteQuestion.title}.`
            : `Debe completar los detalles de la pregunta ${firstIncompleteQuestion.id}: ${firstIncompleteQuestion.title}.`,
        );
        return false;
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

  useEffect(() => {
    if (!approvalSnapshot) return;

    if (getApprovalSnapshot(formData) !== approvalSnapshot) {
      setApprovalSnapshot(null);
    }
  }, [approvalSnapshot, formData]);

  const handleApprovePreview = () => {
    if (previewMode !== 'draft') return;

    setApprovalSnapshot(getApprovalSnapshot(formData));
    setCompletedSteps((steps) =>
      steps.includes(5) ? steps : [...steps, 5],
    );
    setShowPreviewModal(false);
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviewClose = () => {
    setShowPreviewModal(false);
  };

  const handlePreviewBack = () => {
    setShowPreviewModal(false);
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewDraft = () => {
    setPreviewMode('draft');
    setShowPreviewModal(true);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    saveDraft();

    if (currentStep === 5) {
      setPreviewMode('draft');
      setShowPreviewModal(true);
      return;
    }

    if (currentStep === 6) {
      if (
        !approvalSnapshot ||
        getApprovalSnapshot(formData) !== approvalSnapshot
      ) {
        setApprovalSnapshot(null);
        setPreviewMode('draft');
        setShowPreviewModal(true);
        return;
      }

      setPreviewMode('final');
      setShowPreviewModal(true);
      return;
    }

    if (currentStep < STEPS.length) {
      setStepDirection('forward');
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setStepDirection('backward');
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoadSampleData = () => {
    const allNoAnswers = { 1: 'NO' as const, 2: 'NO' as const, 3: 'NO' as const };
    const sampleQuestions = Object.fromEntries(
      HEALTH_QUESTIONS.map((question) => [
        question.id,
        question.requiresBeneficiarySelection === false
          ? { respuesta: 'NO' as const }
          : { respuesta: 'NO' as const, respuestasAfiliados: { ...allNoAnswers } },
      ]),
    ) as SolicitudAfiliacionFormState['salud']['preguntas'];
    sampleQuestions[3] = {
      respuesta: 'SÍ',
      codigosAfiliados: [1],
      respuestasAfiliados: { 1: 'SÍ', 2: 'NO', 3: 'NO' },
    };
    sampleQuestions[15] = {
      respuesta: 'SÍ',
      codigosAfiliados: [2],
      respuestasAfiliados: { 1: 'NO', 2: 'SÍ', 3: 'NO' },
      detallesExtraPorAfiliado: { 2: '1 embarazo a término sin complicaciones' },
      detallesExtra: '#2: 1 embarazo a término sin complicaciones',
    };
    sampleQuestions[17] = {
      respuesta: 'SÍ',
      codigosAfiliados: [1],
      respuestasAfiliados: { 1: 'SÍ', 2: 'NO', 3: 'NO' },
    };

    setFormData(normalizeFormNames({
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
        estadoResidencia: 'Lara',
        ciudadResidencia: 'Barquisimeto',
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
        preguntas: sampleQuestions,
        detallesDeportivos: [
          { codigoAfiliado: 1, deporte: 'Ciclismo de ruta', frecuencia: '2 veces por semana', nivel: 'Amateur' },
        ],
        detallesAclaracion: {},
        afeccionesDetalles: [
          {
            id: 'af1',
            preguntaId: 3,
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
    }));
    setCompletedSteps([1, 2, 3, 4, 5]);
    setApprovalSnapshot(null);
    setPreviewMode('draft');
    setShowPreviewModal(false);
    alert('¡Datos de demostración cargados exitosamente!');
  };

  const handleReset = () => {
    if (confirm('¿Deseas reiniciar todos los campos del formulario?')) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(INITIAL_STATE);
      setCompletedSteps([]);
      setStepDirection('backward');
      setCurrentStep(1);
      setApprovalSnapshot(null);
      setPreviewMode('draft');
      setShowPreviewModal(false);
    }
  };

  return (
    <div className="afiliacion-page" style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', paddingBottom: '6rem' }}>
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
          transition: transform 180ms ease, opacity 180ms ease;
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
        .afiliacion-bottom-action {
          display: flex;
          flex: 1;
        }
        .afiliacion-bottom-action:last-child {
          justify-content: flex-end;
        }
        .afiliacion-bottom-label-mobile {
          display: none;
        }
        .afiliacion-bottom-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--previasis-dark-green);
        }

        @media (max-width: 768px) {
          .afiliacion-page:has(input:focus, select:focus, textarea:focus) .afiliacion-bottom-bar {
            transform: translateY(calc(100% + 2rem));
            opacity: 0;
            pointer-events: none;
          }
          .afiliacion-progress-card {
            padding: 1rem !important;
          }
          .afiliacion-hero {
            padding: 1.5rem 1rem 2.5rem 1rem;
          }
          .afiliacion-hero-brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            min-width: 0;
            width: 100%;
          }
          .afiliacion-hero-brand > div:last-child {
            min-width: 0;
            width: 100%;
          }
          .afiliacion-hero-brand .pill-badge {
            max-width: 100%;
            white-space: normal;
          }
          .afiliacion-hero-logo {
            display: none;
          }
          .afiliacion-hero-actions {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .afiliacion-hero-action-btn {
            width: 100%;
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
            bottom: max(0.5rem, env(safe-area-inset-bottom));
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

        @media (max-width: 600px) {
          .afiliacion-page {
            padding-bottom: calc(8rem + env(safe-area-inset-bottom)) !important;
          }
          .afiliacion-hero {
            padding: 1.25rem 0.75rem 2rem 0.75rem;
          }
          .afiliacion-hero h1 {
            font-size: 1.25rem !important;
          }
          .afiliacion-hero-actions {
            gap: 0.375rem;
          }
          .afiliacion-hero-actions .afiliacion-reset-button {
            grid-column: 1 / -1;
          }
          .afiliacion-bottom-inner {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "progress progress"
              "previous next";
            padding: 0.625rem 0.75rem;
            row-gap: 0.45rem;
          }
          .afiliacion-bottom-action {
            min-width: 0;
          }
          .afiliacion-bottom-action:first-child {
            grid-area: previous;
          }
          .afiliacion-bottom-action:last-child {
            grid-area: next;
          }
          .afiliacion-bottom-progress {
            grid-area: progress;
            justify-content: center;
          }
          .afiliacion-bottom-action .btn-pill {
            width: 100%;
            min-width: 0;
          }
          .afiliacion-bottom-label-desktop {
            display: none;
          }
          .afiliacion-bottom-label-mobile {
            display: inline;
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
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
              <Sparkles size={14} color="#84CC16" />
              <span className="afiliacion-bottom-label-desktop">Cargar Ejemplo</span>
              <span className="afiliacion-bottom-label-mobile">Ejemplo</span>
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="btn-pill btn-pill-secondary afiliacion-hero-action-btn"
            >
              <Save size={14} />
              <span className="afiliacion-bottom-label-desktop">Guardar borrador</span>
              <span className="afiliacion-bottom-label-mobile">Guardar</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-pill btn-pill-secondary afiliacion-hero-action-btn afiliacion-reset-button"
              aria-label="Reiniciar formulario"
            >
              <RotateCcw size={14} /> Reiniciar
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
        <div className="previasis-card afiliacion-progress-card" style={{ padding: '1.25rem 1.5rem' }}>
          <StepProgress
            steps={STEPS}
            currentStep={currentStep}
            onSelectStep={(step) => {
              if (step <= currentStep || completedSteps.includes(step)) {
                setStepDirection(step >= currentStep ? 'forward' : 'backward');
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Contents */}
        <div
          key={currentStep}
          className={`afiliacion-step-transition afiliacion-step-transition--${stepDirection}`}
        >
          {currentStep === 1 && (
            <Step1HeaderAndTitular
              header={formData.header}
              titular={formData.titular}
              onChangeHeader={(header) => setFormData((previous) => ({
                ...previous,
                header: mergeChangedValues(previous.header, formData.header, header),
              }))}
              onChangeTitular={(titular) => {
                const normalizedTitular = {
                  ...titular,
                  nombres: uppercaseName(titular.nombres),
                  apellidos: uppercaseName(titular.apellidos),
                };
                setFormData((previous) => ({
                  ...previous,
                  titular: mergeChangedValues(
                    previous.titular,
                    formData.titular,
                    normalizedTitular,
                  ),
                }));
              }}
            />
          )}

          {currentStep === 2 && (
            <Step2contractor
              contratista={formData.contratante}
              onChangeContratista={(contratante) => {
                const normalizedContratante = {
                  ...contratante,
                  tipoPersona: 'Natural',
                  personaNatural: {
                    ...contratante.personaNatural,
                    nombres: uppercaseName(contratante.personaNatural.nombres),
                    apellidos: uppercaseName(contratante.personaNatural.apellidos),
                  },
                  personaJuridica: {
                    ...contratante.personaJuridica,
                    representanteLegal: {
                      ...contratante.personaJuridica.representanteLegal,
                      nombres: uppercaseName(contratante.personaJuridica.representanteLegal.nombres),
                      apellidos: uppercaseName(contratante.personaJuridica.representanteLegal.apellidos),
                    },
                  },
                } as typeof contratante;
                setFormData((previous) => ({
                  ...previous,
                  contratante: mergeChangedValues(
                    previous.contratante,
                    formData.contratante,
                    normalizedContratante,
                  ),
                }));
              }}
            />
          )}

          {currentStep === 3 && (
            <Step3AfiliadosPlan
              afiliados={formData.afiliados}
              onChangeAfiliados={handleAfiliadosChange}
              frecuenciaPago={formData.pago.frecuenciaPago}
              onChangeFrecuenciaPago={(frecuenciaPago) => setFormData((previous) => ({
                ...previous,
                pago: { ...previous.pago, frecuenciaPago },
              }))}
              titularNombreCompleto={`${formData.titular.nombres} ${formData.titular.apellidos}`}
              titularDoc={formData.titular.numDoc}
            />
          )}

          {currentStep === 4 && (
            <Step4DeclaracionSalud
              salud={formData.salud}
              afiliados={formData.afiliados}
              onChangeSalud={(salud) => setFormData((previous) => ({
                ...previous,
                salud: mergeChangedValues(previous.salud, formData.salud, salud),
              }))}
              onComplete={handleNext}
            />
          )}

          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Step5PagoYOtros
                pago={formData.pago}
                onChangePago={(pago) => setFormData((previous) => ({
                  ...previous,
                  pago: mergeChangedValues(previous.pago, formData.pago, pago),
                }))}
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
              onChangeFirmas={(firmas) => setFormData((previous) => ({
                ...previous,
                firmas: mergeChangedValues(previous.firmas, formData.firmas, firmas),
              }))}
              onChangeIntermediario={(intermediario) => {
                const normalizedIntermediario = {
                  ...intermediario,
                  nombreApellido: uppercaseName(intermediario.nombreApellido),
                };
                setFormData((previous) => ({
                  ...previous,
                  intermediario: mergeChangedValues(
                    previous.intermediario,
                    formData.intermediario,
                    normalizedIntermediario,
                  ),
                }));
              }}
            />
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM ACTION BAR */}
      <div className="afiliacion-bottom-bar">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="afiliacion-bottom-inner">
            <div className="afiliacion-bottom-action">
              {currentStep === 6 && (
                <button
                  type="button"
                  onClick={handleReviewDraft}
                  className="btn-pill btn-pill-secondary"
                  style={{ marginRight: '0.5rem' }}
                >
                  <FileText size={16} /> Revisar preview
                </button>
              )}
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-pill btn-pill-secondary"
                >
                  <ArrowLeft size={16} /> Anterior
                </button>
              )}
            </div>

            <div className="afiliacion-bottom-progress" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

            <div className="afiliacion-bottom-action">
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-pill btn-pill-primary"
                >
                  <span className="afiliacion-bottom-label-desktop">Siguiente Paso</span>
                  <span className="afiliacion-bottom-label-mobile">Siguiente Paso</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-pill btn-pill-primary"
                  style={{ backgroundColor: 'var(--previasis-green)', boxShadow: '0 4px 16px var(--previasis-green-glow)' }}
                >
                  <Send size={16} />
                  <span className="afiliacion-bottom-label-desktop">Enviar solicitud / Generar PDF</span>
                  <span className="afiliacion-bottom-label-mobile">Generar PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfPreviewModal
        mode={previewMode}
        isOpen={showPreviewModal}
        onClose={handlePreviewClose}
        onBack={previewMode === 'draft' ? handlePreviewBack : undefined}
        onApprove={previewMode === 'draft' ? handleApprovePreview : undefined}
        formData={formData}
      />
    </div>
  );
}
