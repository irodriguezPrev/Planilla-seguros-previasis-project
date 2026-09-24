'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { StepProgress, StepItem } from '@/features/affiliation/StepProgress';
import { Step1HeaderAndPolicyholder } from '@/features/affiliation/steps/Step1HeaderAndPolicyholder';
import { Step2Contractor } from '@/features/affiliation/steps/Step2Contractor';
import { Step3AffiliatesPlan } from '@/features/affiliation/steps/Step3AffiliatesPlan';
import { Step4HealthDeclaration } from '@/features/affiliation/steps/Step4HealthDeclaration';
import { Step5PaymentAndOthers } from '@/features/affiliation/steps/Step5PaymentAndOthers';
import { Step6SignaturesAndDeclarations } from '@/features/affiliation/steps/Step6SignaturesAndDeclarations';
import { PdfPreviewModal } from '@/features/affiliation/PdfPreviewModal';
import { PreviasisLogo } from '@/core/components/common/PreviasisLogo';
import {
  AffiliateRow,
  HealthDeclarationSection,
  AffiliationFormState,
} from '@/core/interfaces/affiliation.interfaces';
import {
  HEALTH_QUESTION_FILLING_GROUPS,
  HEALTH_QUESTIONS,
} from '@/core/config/health-questions.config';
import { getCitiesByState } from '@/core/config/venezuela-locations.config';
import { calculateActuarialAge } from '@/core/utils/age.utils';
import {
  isValidEmail,
  isValidVenezuelanMobilePhone,
} from '@/core/utils/contact-validation.utils';
import { getQuestionStatus } from '@/core/utils/health-progress.utils';
import {
  deserializeAffiliationDraft,
  serializeAffiliationDraft,
} from '@/core/utils/affiliation-draft.mapper';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'previasis_affiliation_draft_v3';

type PreviewMode = 'draft' | 'final';

const CELEBRATION_PROGRESS_STEPS = [1, 2, 3, 4] as const;

interface CelebrationOverlayProps {
  eyebrow: string;
  title: string;
  message: string;
  completedStep?: number;
}

const CelebrationOverlay = ({
  eyebrow,
  title,
  message,
  completedStep,
}: CelebrationOverlayProps) => (
  <div className="step-celebration" role="status" aria-live="polite">
    <span className="step-celebration-backdrop" aria-hidden="true" />
    <div className="step-celebration-card">
      <div className="step-celebration-confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span key={index} className="step-celebration-confetti-piece" />
        ))}
      </div>
      <Sparkles className="step-celebration-sparkle" size={30} aria-hidden="true" />
      <div className="step-celebration-icon" aria-hidden="true">
        <CheckCircle2 size={50} strokeWidth={2.5} />
      </div>
      <span className="step-celebration-eyebrow">{eyebrow}</span>
      <strong className="step-celebration-title">{title}</strong>
      <span className="step-celebration-message">{message}</span>
      {completedStep !== undefined && (
        <span className="step-celebration-progress" aria-hidden="true">
          {CELEBRATION_PROGRESS_STEPS.map((step) => (
            <i key={step} className={step <= completedStep ? 'is-complete' : ''} />
          ))}
        </span>
      )}
    </div>
  </div>
);

const INITIAL_STATE: AffiliationFormState = {
  header: {
    operationType: 'Emisión',
    contractType: 'Individual',
    applicationNumber: '',
    applicationDate: new Date().toISOString().slice(0, 10),
  },
  policyholder: {
    firstNames: '',
    lastNames: '',
    documentType: 'V',
    documentNumber: '',
    taxIdType: 'V',
    taxId: '',
    nationality: 'Venezolana',
    maritalStatus: 'Soltero(a)',
    sex: 'M',
    birthPlace: '',
    birthDate: '',
    profession: '',
    occupation: '',
    businessSector: '',
    annualIncomeBs: '',
    politicallyExposed: 'NO',
    politicallyExposedDescription: '',
    activityClassification: 'Dependiente',
    residenceState: '',
    residenceCity: '',
    homeAddress: '',
    officeAddress: '',
    billingAddress: 'Habitación',
    homePhone: '',
    mobilePhone: '',
    email: '',
  },
  contractor: {
    isDifferent: false,
    personType: 'Natural',
    naturalPerson: {
      firstNames: '',
      lastNames: '',
      documentType: 'V',
      documentNumber: '',
      taxIdType: 'V',
      taxId: '',
      nationality: 'Venezolana',
      maritalStatus: 'Soltero(a)',
      sex: 'M',
      birthPlace: '',
      birthDate: '',
      profession: '',
      occupation: '',
      businessSector: '',
      annualIncomeBs: '',
      politicallyExposed: 'NO',
      politicallyExposedDescription: '',
      activityClassification: 'Dependiente',
      homeAddress: '',
      officeAddress: '',
      billingAddress: '',
      homePhone: '',
      mobilePhone: '',
      email: '',
    },
    legalEntity: {
      legalName: '',
      taxIdType: 'J',
      taxId: '',
      commercialRegistryNumber: '',
      volumeNumber: '',
      registrationDate: '',
      economicActivity: 'Comercial',
      businessSector: '',
      productsServices: '',
      taxAddress: '',
      phone: '',
      previousFiscalYearProfit: '',
      netWorth: '',
      legalRepresentative: {
        firstNames: '',
        lastNames: '',
        documentType: 'V',
        documentNumber: '',
        taxIdType: 'V',
        taxId: '',
        nationality: 'Venezolana',
        maritalStatus: 'Casado(a)',
        sex: 'M',
        birthPlace: '',
        birthDate: '',
        profession: 'Director General',
        occupation: 'Ejecutivo',
        annualIncomeBs: '',
        politicallyExposed: 'NO',
        activityClassification: 'Societaria',
        homeAddress: '',
        officeAddress: '',
        billingAddress: '',
        homePhone: '',
        mobilePhone: '',
        email: '',
      },
    },
  },
  affiliates: [
    {
      id: 'policyholder_row',
      affiliateCode: 1,
      fullName: '',
      documentType: 'V',
      documentNumber: '',
      birthDate: '',
      relationship: 'Titular',
      sex: 'M',
      weightKg: '',
      heightCm: '',
      requestedPlan: 'Plan Oro',
      coverageLimit: '$25.000',
      fee: 0,
    },
  ],
  healthDeclaration: {
    questions: {},
    sportDetails: [],
    clarificationDetails: {},
    medicalConditionDetails: [],
  },
  payment: {
    paymentFrequency: 'Mensual',
    currency: 'Dólares',
    method: 'Pago en Oficina',
  },
  signatures: {
    place: '',
    date: new Date().toISOString().slice(0, 10),
    policyholderSignatureBase64: null,
    contractorSignatureBase64: null,
    acceptsPolicyholderDeclaration: false,
    acceptsContractorSourceOfFunds: false,
  },
  broker: {
    fullName: '',
    credentialNumber: '',
    documentType: 'V',
    identityOrTaxNumber: '',
  },
  attachedDocuments: [],
};



const getApprovalSnapshot = (data: AffiliationFormState): string => JSON.stringify({
  header: data.header,
  policyholder: data.policyholder,
  contractor: data.contractor,
  affiliates: data.affiliates,
  healthDeclaration: data.healthDeclaration,
  payment: data.payment,
});

const uppercaseName = (value: string | undefined) =>
  (value || '').toLocaleUpperCase('es-VE');

const getSubscriptionPlace = (
  policyholder: AffiliationFormState['policyholder'],
): string => {
  const city = policyholder.residenceCity?.trim();
  const state = policyholder.residenceState?.trim();
  return [city, state].filter(Boolean).join(', ');
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);


const mergeChangedValues = <T,>(latest: T, rendered: T, proposed: T): T => {
  if (Object.is(rendered, proposed)) return latest;

  if (Array.isArray(rendered) && Array.isArray(proposed) && Array.isArray(latest)) {
    if (rendered.length !== proposed.length || latest.length !== rendered.length) return proposed as T;

    const sameItems = proposed.every((item, index) => {
      const renderedItem = rendered[index];
      if (!isRecord(item) || !isRecord(renderedItem)) return true;
      const itemKey = item.id ?? item.affiliateCode;
      const renderedKey = renderedItem.id ?? renderedItem.affiliateCode;
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
  data: AffiliationFormState,
): AffiliationFormState => {
  const suggestedPlace = getSubscriptionPlace(data.policyholder);
  const shouldUseSuggestedPlace = suggestedPlace && (
    !data.signatures.place?.trim() || data.signatures.place === 'Caracas, Dto. Capital'
  );

  return {
    ...data,
    policyholder: {
      ...data.policyholder,
      firstNames: uppercaseName(data.policyholder.firstNames),
      lastNames: uppercaseName(data.policyholder.lastNames),
    },
    contractor: {
      ...data.contractor,
      naturalPerson: {
        ...data.contractor.naturalPerson,
        firstNames: uppercaseName(data.contractor.naturalPerson.firstNames),
        lastNames: uppercaseName(data.contractor.naturalPerson.lastNames),
      },
      legalEntity: {
        ...data.contractor.legalEntity,
        legalRepresentative: {
          ...data.contractor.legalEntity.legalRepresentative,
          firstNames: uppercaseName(data.contractor.legalEntity.legalRepresentative.firstNames),
          lastNames: uppercaseName(data.contractor.legalEntity.legalRepresentative.lastNames),
        },
      },
    },
    affiliates: data.affiliates.map((affiliate) => ({
      ...affiliate,
      fullName: uppercaseName(affiliate.fullName),
    })),
    broker: {
      ...data.broker,
      fullName: uppercaseName(data.broker.fullName),
    },
    signatures: {
      ...data.signatures,
      place: shouldUseSuggestedPlace ? suggestedPlace : data.signatures.place,
    },
  };
};

const reconcileAffiliateHealthData = (
  healthDeclaration: HealthDeclarationSection,
  previousAffiliates: AffiliateRow[],
  nextAffiliates: AffiliateRow[],
): HealthDeclarationSection => {
  const previousCodeById = new Map(
    previousAffiliates.map((affiliate) => [affiliate.id, affiliate.affiliateCode]),
  );
  const codeMap = new Map<number, number>();

  nextAffiliates.forEach((affiliate) => {
    const previousCode = previousCodeById.get(affiliate.id);
    if (previousCode !== undefined) codeMap.set(previousCode, affiliate.affiliateCode);
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

  const questions = Object.fromEntries(
    Object.entries(healthDeclaration.questions).map(([questionId, state]) => {
      const hasAffiliateData =
        state.affiliateAnswers !== undefined ||
        state.extraDetailsByAffiliate !== undefined ||
        state.affiliateCodes !== undefined;

      if (!hasAffiliateData) return [questionId, state];

      const affiliateAnswers = remapRecord(state.affiliateAnswers);
      const extraDetailsByAffiliate = remapRecord(state.extraDetailsByAffiliate);
      const mappedSelectedCodes = (state.affiliateCodes || [])
        .map((code) => codeMap.get(code))
        .filter((code): code is number => code !== undefined);
      const affirmativeCodes = Object.entries(affiliateAnswers || {})
        .filter(([, answer]) => answer === 'SÍ')
        .map(([code]) => Number(code));
      const affiliateCodes = Array.from(new Set([
        ...mappedSelectedCodes,
        ...affirmativeCodes,
      ])).sort((a, b) => a - b);
      const extraDetails = Object.entries(extraDetailsByAffiliate || {})
        .filter(([, value]) => value?.trim())
        .map(([code, value]) => `#${code}: ${value}`)
        .join(' | ');

      return [questionId, {
        ...state,
        answer: affiliateCodes.length > 0 ? 'SÍ' as const : 'NO' as const,
        affiliateAnswers,
        extraDetailsByAffiliate,
        affiliateCodes,
        extraDetails: extraDetails || undefined,
      }];
    }),
  ) as HealthDeclarationSection['questions'];

  return {
    ...healthDeclaration,
    questions,
    medicalConditionDetails: healthDeclaration.medicalConditionDetails
      .filter((detail) => codeMap.has(Number(detail.affiliateCode)))
      .map((detail) => ({
        ...detail,
        affiliateCode: codeMap.get(Number(detail.affiliateCode))!,
      })),
    sportDetails: (healthDeclaration.sportDetails || [])
      .filter((detail) => codeMap.has(detail.affiliateCode))
      .map((detail) => ({
        ...detail,
        affiliateCode: codeMap.get(detail.affiliateCode)!,
      })),
    clarificationDetails: Object.fromEntries(
      Object.entries(healthDeclaration.clarificationDetails || {}).map(([questionId, details]) => [
        questionId,
        details
          .filter((detail) => codeMap.has(detail.affiliateCode))
          .map((detail) => ({
            ...detail,
            affiliateCode: codeMap.get(detail.affiliateCode)!,
          })),
      ]),
    ),
  };
};

export default function AffiliationPage() {
  const t = useTranslations('steps');
  const tAffiliation = useTranslations('affiliation');
  const tValidation = useTranslations('validation');
  const stepsT = useTranslations('stepProgress');
  const healthGroupsT = useTranslations('healthGroups');

  const STEPS: StepItem[] = [
    { id: 1, title: t('step1.title'), shortTitle: t('step1.shortTitle'), description: t('step1.description') },
    { id: 2, title: t('step2.title'), shortTitle: t('step2.shortTitle'), description: t('step2.description') },
    { id: 3, title: t('step3.title'), shortTitle: t('step3.shortTitle'), description: t('step3.description') },
    { id: 4, title: t('step4.title'), shortTitle: t('step4.shortTitle'), description: t('step4.description') },
    { id: 5, title: t('step5.title'), shortTitle: t('step5.shortTitle'), description: t('step5.description') },
    { id: 6, title: t('step6.title'), shortTitle: t('step6.shortTitle'), description: t('step6.description') },
  ];
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<AffiliationFormState>(INITIAL_STATE);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [validationAttemptedSteps, setValidationAttemptedSteps] = useState<number[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('draft');
  const [approvalSnapshot, setApprovalSnapshot] = useState<string | null>(null);
  const [savedAlert, setSavedAlert] = useState<boolean>(false);
  const [touchDiagnostic, setTouchDiagnostic] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [celebrationStep, setCelebrationStep] = useState<number | null>(null);
  const [renderedStepValidity, setRenderedStepValidity] = useState({
    step: 0,
    isValid: false,
  });

  useEffect(() => {
    if (celebrationStep === null) return;
    const timeout = window.setTimeout(() => setCelebrationStep(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [celebrationStep]);
  const successTimeoutRef = useRef<number | null>(null);
  const hasShownFinalCelebrationRef = useRef(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('touchdebug')) return;

    let touchCount = 0;
    const viewportDescription = () =>
      `${window.innerWidth}x${window.innerHeight} · DPR ${window.devicePixelRatio}`;
    setTouchDiagnostic(`DIAGNÓSTICO ACTIVO · ${viewportDescription()} · toca un control`);

    const describeElement = (element: EventTarget | null) => {
      if (!(element instanceof HTMLElement)) return 'desconocido';
      const id = element.id ? `#${element.id}` : '';
      const classes = typeof element.className === 'string'
        ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join('')
        : '';
      return `${element.tagName.toLocaleLowerCase()}${id}${classes}`;
    };

    const handlePointerDown = (event: PointerEvent) => {
      touchCount += 1;
      const topElement = document.elementFromPoint(event.clientX, event.clientY);
      setTouchDiagnostic(
        `TOQUE ${touchCount} · objetivo: ${describeElement(event.target)} · capa superior: ${describeElement(topElement)} · ${viewportDescription()}`,
      );
    };

    const handleError = (event: ErrorEvent) => {
      setTouchDiagnostic(`ERROR JS · ${event.message || 'sin descripción'}`);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = deserializeAffiliationDraft(JSON.parse(saved));
        const healthDeclaration = parsed.healthDeclaration || {
          questions: {},
          sportDetails: [],
          clarificationDetails: {},
          medicalConditionDetails: [],
        };
        const questions = { ...healthDeclaration.questions };
        setFormData(normalizeFormNames({
          ...parsed,
          healthDeclaration: {
            ...healthDeclaration,
            questions,
            medicalConditionDetails: (healthDeclaration.medicalConditionDetails || [])
              .filter((detail) => {
                const conditionName = detail.condition.trim().toLocaleLowerCase('es-VE');
                return !(
                  detail.questionId === 6 &&
                  (conditionName === 'y otros similares' || conditionName === 'otros similares')
                );
              })
              .map((detail) =>
                detail.condition.trim().toLocaleLowerCase('es-VE') === 'presbicia o similares'
                  ? { ...detail, condition: 'Presbicia' }
                  : detail,
              ),
          },
          contractor: {
            ...parsed.contractor,
            personType: 'Natural',
          },
        }));
      }
    } catch (e) {
      console.error('Error cargando borrador:', e);
    }
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeAffiliationDraft(formData)));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2000);
    } catch (e) {
      console.error('Error guardando borrador:', e);
    }
  }, [formData]);


  useEffect(() => {
    if (formData.policyholder.firstNames || formData.policyholder.lastNames) {
      const full = `${formData.policyholder.firstNames} ${formData.policyholder.lastNames}`.trim();
      setFormData((prev) => {
        const updatedAffiliates = [...prev.affiliates];
        if (updatedAffiliates.length > 0) {
          updatedAffiliates[0] = {
            ...updatedAffiliates[0],
            fullName: full || updatedAffiliates[0].fullName,
            documentNumber: prev.policyholder.documentNumber || updatedAffiliates[0].documentNumber,
            documentType: prev.policyholder.documentType,
            birthDate: prev.policyholder.birthDate || updatedAffiliates[0].birthDate,
            sex: prev.policyholder.sex,
          };
        }
        return { ...prev, affiliates: updatedAffiliates };
      });
    }
  }, [
    formData.policyholder.firstNames,
    formData.policyholder.lastNames,
    formData.policyholder.documentNumber,
    formData.policyholder.documentType,
    formData.policyholder.birthDate,
    formData.policyholder.sex,
  ]);

  const handleAffiliatesChange = (nextAffiliates: AffiliateRow[]) => {
    const normalizedAffiliates = nextAffiliates.map((affiliate) => ({
      ...affiliate,
      fullName: uppercaseName(affiliate.fullName),
    }));
    const compositionChanged =
      formData.affiliates.length !== normalizedAffiliates.length ||
      formData.affiliates.some((affiliate, index) => affiliate.id !== normalizedAffiliates[index]?.id);

    if (compositionChanged) {
      setCompletedSteps((steps) => steps.filter((step) => step < 4));
    }

    setFormData((previous) => {
      const mergedAffiliates = mergeChangedValues(
        previous.affiliates,
        formData.affiliates,
        normalizedAffiliates,
      );
      return {
        ...previous,
        affiliates: mergedAffiliates,
        healthDeclaration: reconcileAffiliateHealthData(
          previous.healthDeclaration,
          previous.affiliates,
          mergedAffiliates,
        ),
      };
    });
  };

  const isStepDataComplete = useCallback((step: number): boolean => {
    if (step === 1) {
      const policyholder = formData.policyholder;
      const validCities = getCitiesByState(policyholder.residenceState);
      return Boolean(
        policyholder.firstNames.trim() &&
        policyholder.lastNames.trim() &&
        policyholder.documentNumber.trim() &&
        policyholder.taxId.trim() &&
        policyholder.birthDate &&
        policyholder.residenceState &&
        policyholder.residenceCity &&
        validCities.includes(policyholder.residenceCity) &&
        policyholder.mobilePhone.trim() &&
        policyholder.email.trim() &&
        isValidEmail(policyholder.email) &&
        isValidVenezuelanMobilePhone(policyholder.mobilePhone)
      );
    }

    if (step === 2) {
      if (!formData.contractor.isDifferent) return true;
      const contractor = formData.contractor.naturalPerson;
      return Boolean(
        contractor.firstNames.trim() &&
        contractor.lastNames.trim() &&
        contractor.documentNumber.trim()
      );
    }

    if (step === 3) {
      return formData.affiliates.length > 0 && formData.affiliates.every((affiliate) => {
        const age = calculateActuarialAge(affiliate.birthDate);
        return Boolean(
          affiliate.fullName.trim() &&
          affiliate.documentNumber.trim() &&
          affiliate.birthDate &&
          affiliate.relationship &&
          affiliate.sex &&
          affiliate.weightKg.trim() &&
          affiliate.heightCm.trim() &&
          affiliate.requestedPlan &&
          affiliate.coverageLimit &&
          age !== null &&
          age <= 80
        );
      });
    }

    if (step === 4) {
      return HEALTH_QUESTION_FILLING_GROUPS.every((group) =>
        group.questionIds.every((questionId) => {
          const question = HEALTH_QUESTIONS.find((item) => item.id === questionId)!;
          return getQuestionStatus(
            formData.healthDeclaration,
            question,
            formData.affiliates,
          ) === 'complete';
        }),
      );
    }

    if (step === 5) {
      return Boolean(
        formData.payment.paymentFrequency &&
        formData.payment.method &&
        (formData.payment.method !== 'Otro' || formData.payment.otherPaymentDetails?.trim())
      );
    }

    if (step === 6) {
      return Boolean(
        formData.signatures.acceptsPolicyholderDeclaration &&
        formData.signatures.acceptsContractorSourceOfFunds &&
        formData.signatures.policyholderSignatureBase64 &&
        (!formData.contractor.isDifferent || formData.signatures.contractorSignatureBase64) &&
        formData.signatures.place.trim() &&
        formData.signatures.date &&
        formData.broker.fullName.trim() &&
        formData.broker.credentialNumber.trim() &&
        formData.broker.identityOrTaxNumber.trim()
      );
    }

    return false;
  }, [formData]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const stepContainer = document.querySelector<HTMLElement>(
        `[data-form-step="${currentStep}"]`,
      );
      const fields = stepContainer
        ? Array.from(
            stepContainer.querySelectorAll<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >('input, select, textarea'),
          )
        : [];
      const isValid = Boolean(stepContainer) && fields.every((field) => field.validity.valid);

      setRenderedStepValidity((previous) =>
        previous.step === currentStep && previous.isValid === isValid
          ? previous
          : { step: currentStep, isValid },
      );
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [currentStep, formData]);

  const isCurrentStepReady =
    renderedStepValidity.step === currentStep &&
    renderedStepValidity.isValid &&
    isStepDataComplete(currentStep);

  const validateStep = (step: number): boolean => {
    const firstInvalidField = document.querySelector<HTMLElement>(
      `[data-form-step="${step}"] input:invalid, ` +
      `[data-form-step="${step}"] select:invalid, ` +
      `[data-form-step="${step}"] textarea:invalid`,
    );
    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => firstInvalidField.focus({ preventScroll: true }), 350);
      return false;
    }

    if (step === 1) {
      const t = formData.policyholder;
      const validCities = getCitiesByState(t.residenceState);
      if (
        !t.firstNames ||
        !t.lastNames ||
        !t.documentNumber ||
        !t.taxId ||
        !t.birthDate ||
        !t.residenceState ||
        !t.residenceCity ||
        !validCities.includes(t.residenceCity) ||
        !t.mobilePhone ||
        !t.email
      ) {
         alert(tValidation('policyholderRequired'));
        return false;
      }
      if (!isValidEmail(t.email)) {
        alert(tValidation('invalidEmail'));
        return false;
      }
      if (!isValidVenezuelanMobilePhone(t.mobilePhone)) {
        alert(tValidation('invalidVenezuelanMobile'));
        return false;
      }
    }
    if (step === 2 && formData.contractor.isDifferent) {
      const c = formData.contractor.naturalPerson;
      if (!c.firstNames || !c.lastNames || !c.documentNumber) {
         alert(tValidation('contractorRequired'));
        return false;
      }
    }
    if (step === 3) {
      if (formData.affiliates.length === 0 || !formData.affiliates[0].fullName || !formData.affiliates[0].documentNumber) {
         alert(tValidation('familyGroupRequired'));
        return false;
      }

      if (formData.affiliates.some((affiliate) => {
        const age = calculateActuarialAge(affiliate.birthDate);
        return age === null || age > 80;
      })) {
         alert(tValidation('ageLimit80'));
        return false;
      }
    }
    if (step === 6) {
      if (!formData.signatures.acceptsPolicyholderDeclaration) {
         alert(tValidation('policyholderDeclarationRequired'));
        return false;
      }
      if (!formData.signatures.acceptsContractorSourceOfFunds) {
         alert(tValidation('sourceOfFundsRequired'));
        return false;
      }
      if (!formData.signatures.policyholderSignatureBase64) {
        alert(tValidation('policyholderSignatureRequired'));
        return false;
      }
      if (formData.contractor.isDifferent && !formData.signatures.contractorSignatureBase64) {
        alert(tValidation('contractorSignatureRequired'));
        return false;
      }
      if (!formData.signatures.place || !formData.signatures.date) {
        alert(tValidation('subscriptionPlaceDateRequired'));
        return false;
      }
      const intermediary = formData.broker;
      if (
        !intermediary.fullName ||
        !intermediary.credentialNumber ||
        !intermediary.identityOrTaxNumber
      ) {
        alert(tValidation('brokerRequired'));
        return false;
      }
    }
    if (step === 4) {
      const firstIncompleteGroupIndex = HEALTH_QUESTION_FILLING_GROUPS.findIndex(
        (group) => group.questionIds.some((questionId) => {
          const question = HEALTH_QUESTIONS.find((item) => item.id === questionId)!;
          return getQuestionStatus(formData.healthDeclaration, question, formData.affiliates) !== 'complete';
        }),
      );
      if (firstIncompleteGroupIndex >= 0) {
        const incompleteGroup = HEALTH_QUESTION_FILLING_GROUPS[firstIncompleteGroupIndex];
        const statuses = incompleteGroup.questionIds.map((questionId) => {
          const question = HEALTH_QUESTIONS.find((item) => item.id === questionId)!;
          return getQuestionStatus(formData.healthDeclaration, question, formData.affiliates);
        });
        const needsDetails = statuses.some((status) => status === 'incomplete');
        alert(tValidation(needsDetails ? 'answerDetails' : 'answerQuestion', {
          id: firstIncompleteGroupIndex + 1,
          title: healthGroupsT(`${incompleteGroup.id}.title`),
        }));
        return false;
      }
     }
     if (step === 5) {
       if (!formData.payment.paymentFrequency) {
          alert(tValidation('paymentFrequencyRequired'));
         return false;
       }
       if (!formData.payment.method) {
          alert(tValidation('paymentMethodRequired'));
         return false;
       }
       if (formData.payment.method === 'Otro' && !formData.payment.otherPaymentDetails) {
          alert(tValidation('otherPaymentMethodRequired'));
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
    setValidationAttemptedSteps((steps) =>
      steps.includes(currentStep) ? steps : [...steps, currentStep],
    );
    if (!validateStep(currentStep)) return;

    const isFirstCompletion = !completedSteps.includes(currentStep);
    if (isFirstCompletion) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    saveDraft();

    if (currentStep === 5) {
      setPreviewMode('draft');
      setShowPreviewModal(true);
      return;
    }

    if (currentStep === 6) {
      const openFinalPreview = () => {
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
      };

      if (!hasShownFinalCelebrationRef.current) {
        hasShownFinalCelebrationRef.current = true;
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        setShowSuccessMessage(true);
        successTimeoutRef.current = window.setTimeout(() => {
          successTimeoutRef.current = null;
          setShowSuccessMessage(false);
          openFinalPreview();
        }, 2500);
      } else {
        openFinalPreview();
      }
      return;
    }

    if (currentStep < STEPS.length) {
      if (isFirstCompletion) setCelebrationStep(currentStep);
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
          ? { answer: 'NO' as const }
          : { answer: 'NO' as const, affiliateAnswers: { ...allNoAnswers } },
      ]),
    ) as AffiliationFormState['healthDeclaration']['questions'];
    sampleQuestions[3] = {
      answer: 'SÍ',
      affiliateCodes: [1],
      affiliateAnswers: { 1: 'SÍ', 2: 'NO', 3: 'NO' },
    };
    sampleQuestions[15] = {
      answer: 'SÍ',
      affiliateCodes: [2],
      affiliateAnswers: { 1: 'NO', 2: 'SÍ', 3: 'NO' },
      extraDetailsByAffiliate: { 2: '1 embarazo a término sin complicaciones' },
      extraDetails: '#2: 1 embarazo a término sin complicaciones',
    };
    sampleQuestions[17] = {
      answer: 'SÍ',
      affiliateCodes: [1],
      affiliateAnswers: { 1: 'SÍ', 2: 'NO', 3: 'NO' },
    };

    setFormData(normalizeFormNames({
      header: {
        operationType: 'Emisión',
        contractType: 'Individual',
        applicationNumber: 'SOL-2026-0089',
        applicationDate: new Date().toISOString().slice(0, 10),
      },
      policyholder: {
        firstNames: 'Carlos Andrés',
        lastNames: 'Mendoza Ruiz',
        documentType: 'V',
        documentNumber: '18456789',
        taxIdType: 'V',
        taxId: '18456789-0',
        nationality: 'Venezolana',
        maritalStatus: 'Casado(a)',
        sex: 'M',
        birthPlace: 'Barquisimeto, Lara, Venezuela',
        birthDate: '1988-04-12',
        profession: 'Ingeniero Civil',
        occupation: 'Consultor de Obras',
        annualIncomeBs: '$ 4.200,00',
        politicallyExposed: 'NO',
        politicallyExposedDescription: '',
        activityClassification: 'Independiente',
        residenceState: 'Lara',
        residenceCity: 'Barquisimeto',
        homeAddress: 'Av. Pedro León Torres, Res. París, Apto 5-A, Barquisimeto, Lara',
        officeAddress: 'Edificio Centro Empresarial, Piso 4, Barquisimeto',
        billingAddress: 'Habitación',
        homePhone: '0251-2521199',
        mobilePhone: '0414-5231144',
        email: 'carlos.mendoza@previasis.com',
      },
      contractor: {
        isDifferent: false,
        personType: 'Natural',
        naturalPerson: { ...INITIAL_STATE.contractor.naturalPerson },
        legalEntity: { ...INITIAL_STATE.contractor.legalEntity },
      },
      affiliates: [
        {
          id: '1',
          affiliateCode: 1,
          fullName: 'Carlos Andrés Mendoza Ruiz',
          documentType: 'V',
          documentNumber: '18456789',
          birthDate: '1988-04-12',
          relationship: 'Titular',
          sex: 'M',
          weightKg: '78',
          heightCm: '178',
          requestedPlan: 'Plan Oro',
          coverageLimit: '$25.000',
          fee: 0,
        },
        {
          id: '2',
          affiliateCode: 2,
          fullName: 'María Elena Mendoza',
          documentType: 'V',
          documentNumber: '19334455',
          birthDate: '1990-08-15',
          relationship: 'Cónyuge',
          sex: 'F',
          weightKg: '60',
          heightCm: '165',
          requestedPlan: 'Plan Oro',
          coverageLimit: '$25.000',
          fee: 0,
        },
        {
          id: '3',
          affiliateCode: 3,
          fullName: 'Lucas Daniel Mendoza',
          documentType: 'V',
          documentNumber: '34112233',
          birthDate: '2017-06-20',
          relationship: 'Hijo/a',
          sex: 'M',
          weightKg: '28',
          heightCm: '128',
          requestedPlan: 'Plan Plata',
          coverageLimit: '$15.000',
          fee: 0,
        },
      ],
      healthDeclaration: {
        questions: sampleQuestions,
        sportDetails: [
          { affiliateCode: 1, sport: 'Ciclismo de ruta', frequency: '2 veces por semana', level: 'Amateur' },
        ],
        clarificationDetails: {},
        medicalConditionDetails: [
          {
            id: 'af1',
            questionId: 3,
            affiliateCode: 1,
            condition: 'Defecto de refracción visual (Miopía)',
            diagnosisDate: '05/2020',
            treatment: 'Lentes de corrección visual',
            lastCheckupDate: '2025-11-10',
            hospital: 'Clínica Acosta Ortiz, Barquisimeto',
          },
        ],
      },
      payment: {
        paymentFrequency: 'Anual',
        currency: 'Dólares',
        method: 'Pago en Oficina',
      },
      signatures: {
        place: 'Barquisimeto, Edo. Lara',
        date: new Date().toISOString().slice(0, 10),
        policyholderSignatureBase64: null,
        contractorSignatureBase64: null,
        acceptsPolicyholderDeclaration: true,
        acceptsContractorSourceOfFunds: true,
      },
      broker: {
        fullName: 'Mariángel Colmenárez',
        credentialNumber: 'CR-007744',
        documentType: 'V',
        identityOrTaxNumber: '15889922',
      },
      attachedDocuments: [],
    }));
    setCompletedSteps([1, 2, 3, 4, 5]);
    setApprovalSnapshot(null);
    setPreviewMode('draft');
    setShowPreviewModal(false);
     alert(tValidation('demoLoaded'));
  };

  const handleReset = () => {
    if (confirm(tAffiliation('resetConfirmation'))) {
      localStorage.removeItem(STORAGE_KEY);
      setFormData(INITIAL_STATE);
      setCompletedSteps([]);
      setStepDirection('backward');
      setValidationAttemptedSteps([]);
      setCurrentStep(1);
      setApprovalSnapshot(null);
      setPreviewMode('draft');
      setShowPreviewModal(false);
      setCelebrationStep(null);
      setShowSuccessMessage(false);
      hasShownFinalCelebrationRef.current = false;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }
  };

  return (
    <div className="affiliation-page" style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', paddingBottom: '6rem' }}>
      {touchDiagnostic && (
        <output
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '60px',
            right: '8px',
            left: '8px',
            zIndex: 2147483647,
            padding: '0.65rem 0.75rem',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            background: '#111827',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            lineHeight: 1.35,
            pointerEvents: 'none',
            boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
          }}
        >
          {touchDiagnostic}
        </output>
      )}
      {celebrationStep !== null && (
        <CelebrationOverlay
          eyebrow={tAffiliation('stepCelebrationEyebrow', { step: celebrationStep })}
          title={tAffiliation(`stepCelebrationTitle${celebrationStep}`)}
          message={tAffiliation(`stepCelebrationMessage${celebrationStep}`)}
          completedStep={celebrationStep}
        />
      )}
      {showSuccessMessage && (
        <CelebrationOverlay
          eyebrow={tAffiliation('finalCelebrationEyebrow')}
          title={tAffiliation('finalCelebrationTitle')}
          message={tAffiliation('successGeneratingPreview')}
        />
      )}
      <style suppressHydrationWarning>{`
        .affiliation-hero {
          background: var(--grad-hero);
          padding: 2.5rem 1.5rem 3.5rem 1.5rem;
          color: #ffffff;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-floating);
        }
        .affiliation-hero-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.25rem;
          position: relative;
          z-index: 10;
        }
        .affiliation-hero-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .affiliation-hero-logo {
          background-color: #ffffff;
          backdrop-filter: blur(10px);
          padding: 0.6rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .affiliation-hero-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .affiliation-hero-action-btn {
          background-color: rgba(255,255,255,0.15);
          color: #ffffff;
          border-color: rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
        }
        .affiliation-content {
          margin-top: -1.5rem;
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .affiliation-bottom-bar {
          position: fixed;
          bottom: 1rem;
          left: 0;
          right: 0;
          z-index: 40;
          transition: transform 180ms ease, opacity 180ms ease;
        }
        .affiliation-bottom-inner {
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
        .affiliation-bottom-action {
          display: flex;
          flex: 1;
        }
        .affiliation-bottom-action:last-child {
          justify-content: flex-end;
        }
        .affiliation-bottom-label-mobile {
          display: none;
        }
        .affiliation-bottom-step {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--previasis-dark-green);
        }

        @media (max-width: 768px) {
          .affiliation-progress-card {
            padding: 1rem !important;
          }
          .affiliation-hero {
            padding: 1.5rem 1rem 2.5rem 1rem;
          }
          .affiliation-hero-brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            min-width: 0;
            width: 100%;
          }
          .affiliation-hero-brand > div:last-child {
            min-width: 0;
            width: 100%;
          }
          .affiliation-hero-brand .pill-badge {
            max-width: 100%;
            white-space: normal;
          }
          .affiliation-hero-logo {
            display: none;
          }
          .affiliation-hero-actions {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .affiliation-hero-action-btn {
            width: 100%;
            min-width: 0;
            justify-content: center;
            font-size: 0.75rem;
            padding: 0.5rem 0.75rem;
          }
          .affiliation-content {
            margin-top: -1rem;
            gap: 1.25rem;
          }
          .affiliation-bottom-bar {
            position: static;
            padding: 0 1rem max(0.75rem, env(safe-area-inset-bottom));
            transform: none;
            opacity: 1;
            pointer-events: auto;
          }
          .affiliation-bottom-inner {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-lg);
            gap: 0.5rem;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            background-color: #ffffff;
          }
          .affiliation-bottom-step {
            font-size: 0.6875rem;
          }
        }

        @media (max-width: 600px) {
          .affiliation-page {
            padding-bottom: 0 !important;
          }
          .affiliation-hero {
            padding: 1.25rem 0.75rem 2rem 0.75rem;
          }
          .affiliation-hero h1 {
            font-size: 1.25rem !important;
          }
          .affiliation-hero-actions {
            gap: 0.375rem;
          }
          .affiliation-hero-actions .affiliation-reset-button {
            grid-column: 1 / -1;
          }
          .affiliation-bottom-inner {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-areas:
              "progress progress"
              "previous next";
            padding: 0.625rem 0.75rem;
            row-gap: 0.45rem;
          }
          .affiliation-bottom-action {
            min-width: 0;
          }
          .affiliation-bottom-action:first-child {
            grid-area: previous;
          }
          .affiliation-bottom-action:last-child {
            grid-area: next;
          }
          .affiliation-bottom-progress {
            grid-area: progress;
            justify-content: center;
          }
          .affiliation-bottom-action .btn-pill {
            width: 100%;
            min-width: 0;
          }
          .affiliation-bottom-label-desktop {
            display: none;
          }
          .affiliation-bottom-label-mobile {
            display: inline;
          }
        }
      `}</style>

      <div className="affiliation-hero">
        <div className="container affiliation-hero-inner">
          <div className="affiliation-hero-brand">
            <div className="affiliation-hero-logo">
              <PreviasisLogo size={42} showText={false} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <span className="pill-badge" style={{ backgroundColor: 'rgba(132, 204, 22, 0.2)', color: '#84CC16', borderColor: 'rgba(132, 204, 22, 0.4)' }}>
                  <ShieldCheck size={13} /> {tAffiliation('regulatoryBadge')}
                </span>
                {savedAlert && (
                  <span className="pill-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                    {tAffiliation('savedBadge')}
                  </span>
                )}
              </div>
               <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                 {tAffiliation('heroTitle')}
               </h1>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                PREVIASIS MEDICINA PREPAGADA S.A. • RIF J-412048970 •
              </p>
            </div>
          </div>


          <div className="affiliation-hero-actions">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="btn-pill btn-pill-secondary affiliation-hero-action-btn"
            >
              <Sparkles size={14} color="#84CC16" />
               <span className="affiliation-bottom-label-desktop">{tAffiliation('loadExample')}</span>
              <span className="affiliation-bottom-label-mobile">{tAffiliation('loadExampleShort')}</span>
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="btn-pill btn-pill-secondary affiliation-hero-action-btn"
            >
               <Save size={14} />
               <span className="affiliation-bottom-label-desktop">{tAffiliation('saveDraft')}</span>
               <span className="affiliation-bottom-label-mobile">{tAffiliation('save')}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-pill btn-pill-secondary affiliation-hero-action-btn affiliation-reset-button"
               aria-label={tAffiliation('resetFormAria')}
             >
               <RotateCcw size={14} /> {tAffiliation('reset')}
            </button>
          </div>
        </div>


        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div className="ecg-line" />
        </div>
      </div>


      <div className="container affiliation-content">

        <div className="previasis-card affiliation-progress-card" style={{ padding: '1.25rem 1.5rem' }}>
          <StepProgress
            steps={STEPS}
            currentStep={currentStep}
            onSelectStep={(step) => {
              if (
                step <= currentStep ||
                (isCurrentStepReady && completedSteps.includes(step))
              ) {
                setStepDirection(step >= currentStep ? 'forward' : 'backward');
                setCurrentStep(step);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            completedSteps={completedSteps}
          />
        </div>


        <div
          key={currentStep}
          data-form-step={currentStep}
          className={`affiliation-step-transition affiliation-step-transition--${stepDirection} ${
            validationAttemptedSteps.includes(currentStep) ? 'show-validation-errors' : ''
          }`}
        >
          {currentStep === 1 && (
            <Step1HeaderAndPolicyholder
              header={formData.header}
              policyholder={formData.policyholder}
              onChangeHeader={(header) => setFormData((previous) => ({
                ...previous,
                header: mergeChangedValues(previous.header, formData.header, header),
              }))}
              onPolicyholderChange={(policyholder) => {
                const normalizedPolicyholder = {
                  ...policyholder,
                  firstNames: uppercaseName(policyholder.firstNames),
                  lastNames: uppercaseName(policyholder.lastNames),
                };
                setFormData((previous) => {
                  const mergedPolicyholder = mergeChangedValues(
                    previous.policyholder,
                    formData.policyholder,
                    normalizedPolicyholder,
                  );
                  const nextSuggestedPlace = getSubscriptionPlace(mergedPolicyholder);
                  const locationChanged =
                    normalizedPolicyholder.residenceState !== formData.policyholder.residenceState ||
                    normalizedPolicyholder.residenceCity !== formData.policyholder.residenceCity;

                  return {
                    ...previous,
                    policyholder: mergedPolicyholder,
                    signatures: locationChanged
                      ? { ...previous.signatures, place: nextSuggestedPlace }
                      : previous.signatures,
                  };
                });
              }}
            />
          )}

          {currentStep === 2 && (
            <Step2Contractor
              contractor={formData.contractor}
              onContractorChange={(contractor) => {
                const normalizedContractor = {
                  ...contractor,
                  personType: 'Natural',
                  naturalPerson: {
                    ...contractor.naturalPerson,
                    firstNames: uppercaseName(contractor.naturalPerson.firstNames),
                    lastNames: uppercaseName(contractor.naturalPerson.lastNames),
                  },
                  legalEntity: {
                    ...contractor.legalEntity,
                    legalRepresentative: {
                      ...contractor.legalEntity.legalRepresentative,
                      firstNames: uppercaseName(contractor.legalEntity.legalRepresentative.firstNames),
                      lastNames: uppercaseName(contractor.legalEntity.legalRepresentative.lastNames),
                    },
                  },
                } as typeof contractor;
                setFormData((previous) => ({
                  ...previous,
                  contractor: mergeChangedValues(
                    previous.contractor,
                    formData.contractor,
                    normalizedContractor,
                  ),
                }));
              }}
            />
          )}

          {currentStep === 3 && (
            <Step3AffiliatesPlan
              affiliates={formData.affiliates}
              onAffiliatesChange={handleAffiliatesChange}
              paymentFrequency={formData.payment.paymentFrequency}
              onPaymentFrequencyChange={(paymentFrequency) => setFormData((previous) => ({
                ...previous,
                payment: { ...previous.payment, paymentFrequency: paymentFrequency },
              }))}
              policyholderFullName={`${formData.policyholder.firstNames} ${formData.policyholder.lastNames}`}
              policyholderDocument={formData.policyholder.documentNumber}
            />
          )}

          {currentStep === 4 && (
            <Step4HealthDeclaration
              healthDeclaration={formData.healthDeclaration}
              affiliates={formData.affiliates}
              onHealthChange={(updatedHealthDeclaration) => setFormData((previous) => ({
                ...previous,
                healthDeclaration: mergeChangedValues(
                  previous.healthDeclaration,
                  formData.healthDeclaration,
                  updatedHealthDeclaration,
                ),
              }))}
              onComplete={handleNext}
            />
          )}

          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Step5PaymentAndOthers
                payment={formData.payment}
                onPaymentChange={(payment) => setFormData((previous) => ({
                  ...previous,
                  payment: mergeChangedValues(previous.payment, formData.payment, payment),
                }))}
              />


            </div>
          )}

          {currentStep === 6 && (
            <Step6SignaturesAndDeclarations
              signatures={formData.signatures}
              broker={formData.broker}
              policyholder={formData.policyholder}
              contractor={formData.contractor}
              suggestedPlace={getSubscriptionPlace(formData.policyholder)}
              onSignaturesChange={(signatures) => setFormData((previous) => ({
                ...previous,
                signatures: mergeChangedValues(previous.signatures, formData.signatures, signatures),
              }))}
              onBrokerChange={(broker) => {
                const normalizedBroker = {
                  ...broker,
                  fullName: uppercaseName(broker.fullName),
                };
                setFormData((previous) => ({
                  ...previous,
                  broker: mergeChangedValues(
                    previous.broker,
                    formData.broker,
                    normalizedBroker,
                  ),
                }));
              }}
            />
          )}
        </div>
      </div>


      <div className="affiliation-bottom-bar">
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="affiliation-bottom-inner">
            <div className="affiliation-bottom-action">
              {currentStep === 6 && (
          <button
                type="button"
                onClick={handleReviewDraft}
                className="btn-pill btn-pill-secondary"
                style={{ marginRight: '0.5rem' }}
              >
                <FileText size={16} /> {tAffiliation('reviewPreview')}
                </button>
              )}
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn-pill btn-pill-secondary"
                >
                  <ArrowLeft size={16} /> {tAffiliation('back')}
                </button>
              )}
            </div>

            <div className="affiliation-bottom-progress" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={saveDraft}
                className="btn-pill btn-pill-secondary"
                style={{ display: 'none' }}
              >
                 <Save size={14} /> {tAffiliation('save')}
              </button>

              <span className="affiliation-bottom-step">
                {stepsT('stepOf', { current: currentStep, total: STEPS.length })}
              </span>
            </div>

            <div className="affiliation-bottom-action">
              {isCurrentStepReady && (currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-pill btn-pill-primary"
                >
                <span className="affiliation-bottom-label-desktop">
                  {currentStep === 5 ? tAffiliation('reviewDraft') : tAffiliation('nextStep')}
                </span>
                <span className="affiliation-bottom-label-mobile">
                  {currentStep === 5 ? tAffiliation('reviewDraft') : tAffiliation('next')}
                </span>
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
               <span className="affiliation-bottom-label-desktop">{tAffiliation('submitDesktop')}</span>
                <span className="affiliation-bottom-label-mobile">{tAffiliation('submitMobile')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


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
