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
    campo1: string;
    campo2: string;
  };
  beneficiaryDetailPlaceholders?: {
    campo1: string;
    campo2: string;
  };
  beneficiaryDetailOptions?: {
    campo1?: string[];
    campo2?: string[];
  };
  requiresBeneficiarySelection?: boolean;
  requiresClinicalDetail?: boolean;
  detailMode?: 'clinical' | 'sport' | 'beneficiary' | 'extra' | 'antecedent';
  antecedentFields?: {
    campo1Label: string;
    campo2Label: string;
    campo1Placeholder?: string;
    campo2Placeholder?: string;
  };
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
      campo1: 'Tipo de evento',
      campo2: 'Fecha diagnóstico',
    },
    beneficiaryDetailPlaceholders: {
      campo1: 'Ej: Accidente cerebrovascular',
      campo2: 'Ej: 03/2021',
    },
    beneficiaryDetailOptions: {
      campo1: ['Accidente cerebrovascular', 'Hemorragia cerebral'],
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
      campo1: 'Tipo de cirugía',
      campo2: 'Año',
    },
    beneficiaryDetailPlaceholders: {
      campo1: 'Ej: Apendicectomía',
      campo2: 'Ej: 2018',
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
      campo1: 'Medicamento',
      campo2: 'Dosis / Frecuencia',
    },
    beneficiaryDetailPlaceholders: {
      campo1: 'Ej: Losartán',
      campo2: 'Ej: 50mg 1 vez al día',
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
      campo1Label: 'Nº de Contrato',
      campo2Label: 'Nombre de la Compañía',
      campo1Placeholder: 'Ej: 000123',
      campo2Placeholder: 'Ej: Compañía de salud',
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
      campo1Label: 'Tipo de Seguro',
      campo2Label: 'Compañía que Rechazó',
      campo1Placeholder: 'Ej: Colectivo',
      campo2Placeholder: 'Ej: Compañía que rechazó',
    },
  },
];
