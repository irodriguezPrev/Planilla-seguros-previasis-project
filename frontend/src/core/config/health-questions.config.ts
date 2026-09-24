export interface HealthQuestionItem {
  id: number;
  title: string;
  description: string;
  applicableSex?: 'F' | 'M';
  hasExtraInput?: boolean;
  extraInputLabel?: string;
  extraInputPlaceholder?: string;
  beneficiaryDetail?: boolean;
  beneficiaryDetailLabels?: {
    field1: string;
    field2: string;
  };
  beneficiaryDetailPlaceholders?: {
    field1: string;
    field2: string;
  };
  beneficiaryDetailOptions?: {
    field1?: string[];
    field2?: string[];
  };
  requiresBeneficiarySelection?: boolean;
  requiresClinicalDetail?: boolean;
  detailMode?: 'clinical' | 'sport' | 'beneficiary' | 'extra' | 'antecedent';
  antecedentFields?: {
    field1Label: string;
    field2Label: string;
    field1Placeholder?: string;
    field2Placeholder?: string;
    field1Required?: boolean;
  };
}

export interface HealthQuestionFillingGroup {
  id: string;
  questionIds: number[];
  title: string;
  prompt: string;
}

export const HEALTH_QUESTIONS: HealthQuestionItem[] = [
  {
    id: 1,
    title: 'Enfermedades de las vías respiratorias',
    description: 'Alergias, asma, bronquitis, neumonía, tos frecuente, ronquera, tuberculosis, covid-19, fibrosis pulmonar, etc.',
  },
  {
    id: 2,
    title: 'Enfermedades de la piel, ojos, nariz o garganta',
    description: 'Desviación del tabique nasal, amigdalitis, rinitis, sinusitis, otitis recurrente, cataratas, desórdenes de la piel, psoriasis, eccema, verrugas, vitíligo.',
  },
  {
    id: 3,
    title: 'Defectos de refracción visual',
    description: 'Miopía, hipermetropía, astigmatismo, presbicia.',
  },
  {
    id: 4,
    title: 'Enfermedades Cardiovasculares',
    description: 'Hipertensión arterial, infarto al miocardio, insuficiencia coronaria o cardíaca, arteroesclerosis, fiebre reumática, insuficiencias valvulares, tromboflebitis, trombosis venosa profunda, varices, pericarditis.',
  },
  {
    id: 5,
    title: 'Enfermedades Vasculares',
    description: 'Accidentes cerebrovasculares, hemorragias cerebrales.',
    beneficiaryDetail: true,
    detailMode: 'beneficiary',
    requiresClinicalDetail: false,
    beneficiaryDetailLabels: {
      field1: 'Tipo de evento',
      field2: 'Fecha diagnóstico',
    },
    beneficiaryDetailPlaceholders: {
      field1: 'Ej: Accidente cerebrovascular',
      field2: 'Ej: 03/2021',
    },
    beneficiaryDetailOptions: {
      field1: ['Accidente cerebrovascular', 'Hemorragia cerebral'],
    },
  },
  {
    id: 6,
    title: 'Enfermedades del sistema nervioso',
    description: 'Convulsiones, epilepsia, parálisis cerebral, retardo mental, vértigo, autismo.',
  },
  {
    id: 7,
    title: 'Enfermedades digestivas',
    description: 'Enfermedades del estómago, esófago, gastritis, úlcera péptica, hemorragias digestivas, colon irritable, pancreatitis, colecistitis, hemorroides, litiasis vesicular, hernias umbilicales, inguinales o epigástricas.',
  },
  {
    id: 8,
    title: 'Enfermedades de los riñones o las vías urinarias',
    description: 'Infecciones de orina recurrentes y litiasis renal, hematuria (sangre en la orina), próstata.',
  },
  {
    id: 9,
    title: 'Enfermedades osteomusculares',
    description: 'Artritis, gota, hernias discales, lumbalgia, lesiones o desviaciones de la columna vertebral.',
  },
  {
    id: 10,
    title: 'Cáncer o tumores',
    description: 'Cerebrales, tiroides, pulmón, mamas, hepático, páncreas, gástricos, ovarios, útero, cuello uterino, próstata, leucemia, linfoma.',
  },
  {
    id: 11,
    title: 'Enfermedades del sistema endocrino',
    description: 'Diabetes, tiroides, bocio, hipófisis, alteraciones del colesterol y triglicéridos.',
  },
  {
    id: 12,
    title: 'Patologías inmunológicas',
    description: 'Lupus, artritis reumatoidea, esclerodermia, síndrome antifosfolípido, tiroiditis, anemia hemolítica, dermatomiositis.',
  },
  {
    id: 13,
    title: 'Enfermedades de transmisión sexual',
    description: 'Sífilis, gonorrea, clamidia, VIH/SIDA, herpes genital, VPH.',
  },
  {
    id: 14,
    title: 'Femenino',
    description: 'Desórdenes de mamas, dolor pélvico, útero, afecciones de las trompas y ovarios, incontinencia, fibroma.',
    applicableSex: 'F',
  },
  {
    id: 15,
    title: 'Embarazo / Antecedentes Obstétricos',
    description: '¿Alguna(s) de las mujeres incluidas en esta solicitud está embarazada o ha tenido abortos?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Indicar número de embarazos / Semanas / Abortos',
    extraInputPlaceholder: 'Ej: 2 embarazos a término, 0 abortos, actualmente no embarazada',
    applicableSex: 'F',
  },
  {
    id: 16,
    title: 'Masculino',
    description: 'Desórdenes de la próstata, fimosis o parafimosis, retención de orina.',
    applicableSex: 'M',
  },
  {
    id: 17,
    title: 'Práctica Deportiva',
    description: '¿Usted o alguna persona a incluir practica algún deporte?',
    beneficiaryDetail: true,
    detailMode: 'sport',
    requiresClinicalDetail: false,
  },
  {
    id: 18,
    title: 'Enfermedades Congénitas o Hereditarias',
    description: '¿Usted o alguno de los solicitantes padece alguna enfermedad congénita o hereditaria, defecto físico, anomalía, trastorno de desarrollo, desórdenes mentales, síndrome de down?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Indique nombre, apellido del afectado y condición',
    extraInputPlaceholder: 'Ej: Nombre y apellido del afectado y descripción',
  },
  {
    id: 19,
    title: 'Cirugías Previas',
    description: '¿Usted o alguna persona a incluir se ha practicado alguna cirugía? (Funcional o Estética).',
    beneficiaryDetail: true,
    detailMode: 'beneficiary',
    requiresClinicalDetail: false,
    beneficiaryDetailLabels: {
      field1: 'Tipo de cirugía',
      field2: 'Año',
    },
    beneficiaryDetailPlaceholders: {
      field1: 'Ej: Apendicectomía',
      field2: 'Ej: 2018',
    },
  },
  {
    id: 20,
    title: 'Hábitos Psicobiológicos',
    description: '¿Usted o alguna de las personas a incluir usa o ha usado productos de nicotina, bebidas alcohólicas o drogas adictivas?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Indique productos y cantidad por día/semana',
    extraInputPlaceholder: 'Ej: Tabaco 5 cigarrillos/día, alcohol social ocasional',
  },
  {
    id: 21,
    title: 'Tratamiento Médico Actual',
    description: '¿Usted u otra persona a incluir en el contrato se encuentra bajo un tratamiento con algún medicamento?',
    beneficiaryDetail: true,
    detailMode: 'beneficiary',
    requiresClinicalDetail: false,
    beneficiaryDetailLabels: {
      field1: 'Medicamento',
      field2: 'Dosis / Frecuencia',
    },
    beneficiaryDetailPlaceholders: {
      field1: 'Ej: Losartán',
      field2: 'Ej: 50mg 1 vez al día',
    },
  },
  {
    id: 22,
    title: 'Transfusiones de Sangre',
    description: '¿Usted u otra persona a incluir en el contrato ha donado o recibido transfusiones de sangre?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Especifique fecha y motivo',
    extraInputPlaceholder: 'Ej: Recibida por intervención en 2019',
  },
  {
    id: 23,
    title: 'Intervenciones o Tratamientos Planificados',
    description: '¿Usted u otra persona a incluir en el contrato tiene planeado alguna intervención quirúrgica o tratamiento médico?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Especifique procedimiento programado y fecha estimada',
    extraInputPlaceholder: 'Ej: Cirugía programada de rodilla',
  },
  {
    id: 24,
    title: 'Historial Familiar',
    description: '¿Usted u otra persona a incluir en el contrato tiene historial familiar de diabetes, hipertensión, desórdenes del corazón o riñones, cáncer o enfermedad congénita o hereditaria, tuberculosis, enfermedad mental o suicidio?',
    hasExtraInput: true,
    detailMode: 'extra',
    extraInputLabel: 'Especifique parentesco y diagnóstico familiar',
    extraInputPlaceholder: 'Ej: Padre con Hipertensión, Madre con Diabetes tipo 2',
  },
  {
    id: 25,
    title: 'Contratos de salud vigentes con otra compañía',
    description: '¿Mantiene usted o algún familiar contrato de salud vigente con otra compañía?',
    requiresBeneficiarySelection: false,
    requiresClinicalDetail: false,
    detailMode: 'antecedent',
    antecedentFields: {
      field1Label: 'Nº de Contrato',
      field2Label: 'Nombre de la Compañía',
      field1Placeholder: 'Ej: 000123',
      field2Placeholder: 'Ej: Compañía de salud',
      field1Required: false,
    },
  },
  {
    id: 26,
    title: 'Negativa o anulación de contrato de salud',
    description: '¿En alguna oportunidad le ha sido negado o anulado un contrato de salud?',
    requiresBeneficiarySelection: false,
    requiresClinicalDetail: false,
    detailMode: 'antecedent',
    antecedentFields: {
      field1Label: 'Tipo de Seguro',
      field2Label: 'Compañía que Rechazó',
      field1Placeholder: 'Ej: Colectivo',
      field2Placeholder: 'Ej: Compañía que rechazó',
    },
  },
];


export interface ResolvedHealthQuestionItem extends Omit<HealthQuestionItem, 'title' | 'description' | 'extraInputLabel' | 'extraInputPlaceholder' | 'beneficiaryDetailLabels' | 'beneficiaryDetailPlaceholders' | 'antecedentFields'> {
  id: number;
  title: string;
  description: string;
  applicableSex?: 'F' | 'M';
  hasExtraInput?: boolean;
  extraInputLabel?: string;
  extraInputPlaceholder?: string;
  beneficiaryDetail?: boolean;
  beneficiaryDetailLabels?: {
    field1: string;
    field2: string;
  };
  beneficiaryDetailPlaceholders?: {
    field1: string;
    field2: string;
  };
  beneficiaryDetailOptions?: {
    field1?: string[];
    field2?: string[];
  };
  requiresBeneficiarySelection?: boolean;
  requiresClinicalDetail?: boolean;
  detailMode?: 'clinical' | 'sport' | 'beneficiary' | 'extra' | 'antecedent';
  antecedentFields?: {
    field1Label: string;
    field2Label: string;
    field1Placeholder?: string;
    field2Placeholder?: string;
    field1Required?: boolean;
  };
}

type TFunction = (key: string, values?: Record<string, string | number | Date>) => string;

export const getHealthQuestions = (t: TFunction): ResolvedHealthQuestionItem[] =>
  HEALTH_QUESTIONS.map((item) => ({
    ...item,
    title: t(`${item.id}.title`),
    description: t(`${item.id}.description`),
    extraInputLabel: item.extraInputLabel ? t(`${item.id}.extraInputLabel`) : undefined,
    extraInputPlaceholder: item.extraInputPlaceholder ? t(`${item.id}.extraInputPlaceholder`) : undefined,
    beneficiaryDetailLabels: item.beneficiaryDetailLabels
      ? {
          field1: t(`${item.id}.beneficiaryLabels.field1`),
          field2: t(`${item.id}.beneficiaryLabels.field2`),
        }
      : undefined,
    beneficiaryDetailPlaceholders: item.beneficiaryDetailPlaceholders
      ? {
          field1: t(`${item.id}.beneficiaryPlaceholders.field1`),
          field2: t(`${item.id}.beneficiaryPlaceholders.field2`),
        }
      : undefined,
    beneficiaryDetailOptions: item.beneficiaryDetailOptions
      ? {
          field1: item.id === 5
            ? [t('5.strokeOption'), t('5.hemorrhageOption')]
            : item.beneficiaryDetailOptions.field1,
          field2: item.beneficiaryDetailOptions.field2,
        }
      : undefined,
    antecedentFields: item.antecedentFields
      ? {
          field1Label: t(`${item.id}.antecedent.field1Label`),
          field2Label: t(`${item.id}.antecedent.field2Label`),
          field1Placeholder: item.antecedentFields.field1Placeholder
            ? t(`${item.id}.antecedent.field1Placeholder`)
            : undefined,
          field2Placeholder: item.antecedentFields.field2Placeholder
            ? t(`${item.id}.antecedent.field2Placeholder`)
            : undefined,
          field1Required: item.antecedentFields.field1Required,
        }
      : undefined,
  }));
/**
 * Agrupación usada exclusivamente por el asistente de llenado. Los IDs originales
 * se conservan para que cada respuesta continúe llegando a su casilla en el PDF.
 */
export const HEALTH_QUESTION_FILLING_GROUPS: HealthQuestionFillingGroup[] = [
  { id: '1-3', questionIds: [1, 2, 3], title: 'Vías respiratorias, piel y visión', prompt: '¿Usted o algún integrante ha padecido enfermedades de las vías respiratorias, la piel, los ojos, la nariz o la garganta, o defectos de refracción visual?' },
  { id: '4-5', questionIds: [4, 5], title: 'Enfermedades cardiovasculares y vasculares', prompt: '¿Usted o algún integrante ha padecido enfermedades cardiovasculares o vasculares, incluyendo accidentes cerebrovasculares o hemorragias cerebrales?' },
  { id: '6-11-12-13-22', questionIds: [6, 11, 12, 13, 22], title: 'Sistema nervioso, endocrino, inmunológico y antecedentes relacionados', prompt: '¿Usted o algún integrante ha presentado enfermedades del sistema nervioso, endocrinas, inmunológicas o de transmisión sexual, o ha donado o recibido transfusiones de sangre?' },
  { id: '7-8', questionIds: [7, 8], title: 'Sistema digestivo, riñones y vías urinarias', prompt: '¿Usted o algún integrante ha padecido enfermedades digestivas, de los riñones o de las vías urinarias?' },
  { id: '9', questionIds: [9], title: 'Enfermedades osteomusculares', prompt: '¿Usted o algún integrante ha padecido alguna enfermedad osteomuscular?' },
  { id: '10', questionIds: [10], title: 'Cáncer o tumores', prompt: '¿Usted o algún integrante ha padecido cáncer o algún tipo de tumor?' },
  { id: '14-15', questionIds: [14, 15], title: 'Salud femenina y antecedentes obstétricos', prompt: '¿Alguna de las mujeres incluidas presenta o ha presentado afecciones ginecológicas, está embarazada o ha tenido embarazos o abortos?' },
  { id: '16', questionIds: [16], title: 'Salud masculina', prompt: '¿Alguno de los hombres incluidos presenta o ha presentado trastornos de próstata, fimosis, parafimosis o retención de orina?' },
  { id: '17', questionIds: [17], title: 'Práctica deportiva', prompt: '¿Usted o algún integrante practica algún deporte?' },
  { id: '18', questionIds: [18], title: 'Enfermedades congénitas o hereditarias', prompt: '¿Usted o algún integrante padece alguna enfermedad congénita o hereditaria, defecto físico o trastorno del desarrollo?' },
  { id: '19-23', questionIds: [19, 23], title: 'Cirugías e intervenciones', prompt: '¿Usted o algún integrante se ha practicado alguna cirugía o tiene planificada una intervención quirúrgica o tratamiento médico?' },
  { id: '20', questionIds: [20], title: 'Hábitos psicobiológicos', prompt: '¿Usted o algún integrante usa o ha usado nicotina, bebidas alcohólicas o drogas adictivas?' },
  { id: '21', questionIds: [21], title: 'Tratamiento médico actual', prompt: '¿Usted o algún integrante se encuentra actualmente bajo tratamiento con algún medicamento?' },
  { id: '24', questionIds: [24], title: 'Historial familiar', prompt: '¿Usted o algún integrante tiene antecedentes familiares de enfermedades relevantes?' },
  { id: '25-26', questionIds: [25, 26], title: 'Antecedentes de contratos de salud', prompt: '¿Mantiene algún contrato de salud con otra compañía o alguna vez le han negado o anulado uno?' },
];
