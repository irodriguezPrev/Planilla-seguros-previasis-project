import { AffiliateRow } from '@/core/interfaces/affiliation.interfaces';

const getChronologicalAge = (birthDate: string): number | null => {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = (
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day)
  );

  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : null;
};

export const isMinorWithoutIdentityCard = (affiliate: AffiliateRow): boolean => {
  const age = getChronologicalAge(affiliate.birthDate);
  return affiliate.relationship !== 'Titular' && age !== null && age <= 10;
};

export const applyMinorDocument = (
  affiliate: AffiliateRow,
  policyholderDocument: string,
): AffiliateRow => {
  if (isMinorWithoutIdentityCard(affiliate)) {
    const hasExistingOwnDocument = (
      affiliate.documentType !== 'M' && affiliate.documentNumber.trim() !== ''
    );

    if (affiliate.usesOwnDocument || hasExistingOwnDocument) {
      return {
        ...affiliate,
        usesOwnDocument: true,
      };
    }

    return {
      ...affiliate,
      documentType: 'M',
      documentNumber: policyholderDocument.replace(/\D/g, ''),
      usesOwnDocument: false,
    };
  }

  if (affiliate.documentType === 'M') {
    return {
      ...affiliate,
      documentType: 'V',
      documentNumber: '',
      usesOwnDocument: false,
    };
  }

  return affiliate;
};

const getBirthYearSuffix = (birthDate: string): string => {
  const yearMatch = birthDate.match(/^(\d{4})-/) ?? birthDate.match(/(\d{4})$/);
  return yearMatch ? yearMatch[1].slice(-2) : '';
};

export const formatAffiliateDocumentForPdf = (
  affiliate: AffiliateRow,
  affiliates: AffiliateRow[],
): string => {
  if (affiliate.documentType !== 'M') {
    return `${affiliate.documentType}-${affiliate.documentNumber}`;
  }

  const sameBirthDate = affiliates.filter(
    (candidate) => candidate.documentType === 'M' && candidate.birthDate === affiliate.birthDate,
  );
  const siblingSequence = sameBirthDate.length > 1
    ? String(sameBirthDate.indexOf(affiliate) + 1)
    : '';

  return `M-${affiliate.documentNumber}${getBirthYearSuffix(affiliate.birthDate)}${siblingSequence}`;
};
