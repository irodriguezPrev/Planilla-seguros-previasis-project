export interface HealthQuestionItem {
  id: number;
  title: string;
  description: string;
  hasExtraInput?: boolean;
  extraInputLabel?: string;
  extraInputPlaceholder?: string;
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
    description: 'Desviación del tabique nasal, amigdalitis, rinitis, sinusitis, otitis recurrente, cataratas, desórdenes de la piel, psoriasis, eccema, verrugas, vitiligo.',
  },
  {
    id: 3,
    title: 'Defectos de refracción visual',
    description: 'Miopía, hipermetropía, astigmatismo, presbicia o similares.',
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
  },
  {
    id: 6,
    title: 'Enfermedades del sistema nervioso',
    description: 'Convulsiones, epilepsia, parálisis cerebral, retardo mental, vértigo, autismo, y otros similares.',
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
  },
  {
    id: 15,
    title: 'Embarazo / Antecedentes Obstétricos',
    description: '¿Alguna(s) de las mujeres incluidas en esta solicitud está embarazada o ha tenido abortos?',
    hasExtraInput: true,
    extraInputLabel: 'Indicar número de embarazos / Semanas / Abortos',
    extraInputPlaceholder: 'Ej: 2 embarazos a término, 0 abortos, actualmente no embarazada',
  },
  {
    id: 16,
    title: 'Masculino',
    description: 'Desórdenes de la próstata, fimosis o parafimosis, retención de orina.',
  },
  {
    id: 17,
    title: 'Práctica Deportiva',
    description: '¿Usted o alguna persona a incluir practica algún deporte?',
    hasExtraInput: true,
    extraInputLabel: 'Especifique deporte, frecuencia y nivel (Amateur/Profesional)',
    extraInputPlaceholder: 'Ej: Natación 3 veces por semana nivel amateur',
  },
  {
    id: 18,
    title: 'Enfermedades Congénitas o Hereditarias',
    description: '¿Usted o alguno de los solicitantes padece alguna enfermedad congénita o hereditaria, defecto físico, anomalía, trastorno de desarrollo, desórdenes mentales, síndrome de down?',
    hasExtraInput: true,
    extraInputLabel: 'Indique nombre, apellido del afectado y condición',
    extraInputPlaceholder: 'Ej: Nombre y apellido del afectado y descripción',
  },
  {
    id: 19,
    title: 'Cirugías Previas',
    description: '¿Usted o alguna persona a incluir se ha practicado alguna cirugía? (Funcional o Estética).',
    hasExtraInput: true,
    extraInputLabel: 'Indique persona, tipo de cirugía y año',
    extraInputPlaceholder: 'Ej: Apendicectomía (2018), Rinoplastia (2021)',
  },
  {
    id: 20,
    title: 'Hábitos Psicobiológicos',
    description: '¿Usted o alguna de las personas a incluir usa o ha usado productos de nicotina, bebidas alcohólicas o drogas adictivas?',
    hasExtraInput: true,
    extraInputLabel: 'Indique productos y cantidad por día/semana',
    extraInputPlaceholder: 'Ej: Tabaco 5 cigarrillos/día, alcohol social ocasional',
  },
  {
    id: 21,
    title: 'Tratamiento Médico Actual',
    description: '¿Usted u otra persona a incluir en el contrato se encuentra bajo un tratamiento con algún medicamento?',
    hasExtraInput: true,
    extraInputLabel: 'Nombre del medicamento, dosis y frecuencia',
    extraInputPlaceholder: 'Ej: Losartán 50mg 1 vez al día',
  },
  {
    id: 22,
    title: 'Transfusiones de Sangre',
    description: '¿Usted u otra persona a incluir en el contrato ha donado o recibido transfusiones de sangre?',
    hasExtraInput: true,
    extraInputLabel: 'Especifique fecha y motivo',
    extraInputPlaceholder: 'Ej: Recibida por intervención en 2019',
  },
  {
    id: 23,
    title: 'Intervenciones o Tratamientos Planificados',
    description: '¿Usted u otra persona a incluir en el contrato tiene planeado alguna intervención quirúrgica o tratamiento médico?',
    hasExtraInput: true,
    extraInputLabel: 'Especifique procedimiento programado y fecha estimada',
    extraInputPlaceholder: 'Ej: Cirugía programada de rodilla',
  },
  {
    id: 24,
    title: 'Historial Familiar',
    description: '¿Usted u otra persona a incluir en el contrato tiene historial familiar de diabetes, hipertensión, desórdenes del corazón o riñones, cáncer o enfermedad congénita o hereditaria, tuberculosis, enfermedad mental o suicidio?',
    hasExtraInput: true,
    extraInputLabel: 'Especifique parentesco y diagnóstico familiar',
    extraInputPlaceholder: 'Ej: Padre con Hipertensión, Madre con Diabetes tipo 2',
  },
];
