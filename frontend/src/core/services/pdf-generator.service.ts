import { jsPDF } from 'jspdf';
import {
  AffiliationFormState,
  AntecedentDetail,
  LegalEntityData,
  NaturalPersonData,
} from '@/core/interfaces/affiliation.interfaces';
import {
  HEALTH_QUESTIONS,
  OFFICIAL_DECLARATION_QUESTION_IDS,
} from '@/core/config/health-questions.config';
import { getMedicationTimeUnitLabel } from '@/core/utils/constants';
import { formatAffiliateDocumentForPdf } from '@/core/utils/minor-document.utils';


const NOT_APPLICABLE = 'N/A';

type PdfTableCell = { label: string; value: string; x: number; w: number };

type LegalEntityRowValues = {
  razonSocial: string;
  rif: string;
  registroMercantil: string;
  volumenTomo: string;
  fechaRegistro: string;
  actividadEconomica: string;
  sector: string;
  telefono: string;
  utilidadEjercicioAnterior: string;
  patrimonioNeto: string;
  productosServicios: string;
  direccionFiscal: string;
};

// Valores para imprimir el bloque jurídico en N/A cuando el contratante es
// persona natural: el grid conserva las mismas columnas que el caso jurídico.
const LEGAL_ENTITY_NA_VALUES: LegalEntityRowValues = {
  razonSocial: NOT_APPLICABLE,
  rif: NOT_APPLICABLE,
  registroMercantil: NOT_APPLICABLE,
  volumenTomo: NOT_APPLICABLE,
  fechaRegistro: NOT_APPLICABLE,
  actividadEconomica: NOT_APPLICABLE,
  sector: NOT_APPLICABLE,
  telefono: NOT_APPLICABLE,
  utilidadEjercicioAnterior: NOT_APPLICABLE,
  patrimonioNeto: NOT_APPLICABLE,
  productosServicios: NOT_APPLICABLE,
  direccionFiscal: NOT_APPLICABLE,
};

export type PdfGenerationMode = 'draft' | 'final';

export interface PdfGenerationOptions {
  mode?: PdfGenerationMode;
}

export class PdfGeneratorService {

  static async generateApplicationPdf(
    sourceData: AffiliationFormState,
    options: PdfGenerationOptions = {},
  ): Promise<jsPDF> {
    const data = options.mode === 'draft'
      ? {
          ...sourceData,
          signatures: {
            ...sourceData.signatures,
            policyholderSignatureBase64: null,
            contractorSignatureBase64: null,
            acceptsPolicyholderDeclaration: false,
            acceptsContractorSourceOfFunds: false,
          },
        }
      : sourceData;
    const isDraft = options.mode === 'draft';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const originalSetTextColor = doc.setTextColor.bind(doc);
    doc.setTextColor = ((...args: [number, number, number] | [number, number, number, number] | [number]) => {
      if (args.length >= 4) {
        return originalSetTextColor(0, 0, 0, args[3]);
      }
      return originalSetTextColor(0, 0, 0);
    }) as typeof doc.setTextColor;

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    // Límite inferior común para todo el contenido: deja margen libre sobre la
    // línea y los textos del pie de página (evita que los cuadros lo pisen).
    const contentBottomLimit = pageHeight - margin - 18;
    const formatPdfDate = (value?: string | null): string => {
      if (!value) return '-';
      const normalized = String(value).trim();
      if (!normalized) return '-';

      const monthYearMatch = normalized.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
      if (monthYearMatch) return normalized;

      const inputMonthMatch = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
      if (inputMonthMatch) {
        const [, year, month] = inputMonthMatch;
        return `${month}/${year}`;
      }

      const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}$/);
      if (isoMatch) {
        const [year, month, day] = normalized.split('-');
        return `${day}/${month}/${year}`;
      }

      const slashMatch = normalized.match(/^\d{2}\/\d{2}\/\d{4}$/);
      if (slashMatch) {
        return normalized;
      }

      const dateValue = new Date(normalized);
      if (!Number.isNaN(dateValue.getTime())) {
        const day = String(dateValue.getDate()).padStart(2, '0');
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const year = dateValue.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return normalized;
    };
    const logo = await this.loadImage('/images/logo-previasis-horizontal.png').catch(() => null);

    const drawPageHeader = () => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 139, 71);
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, contentWidth, 20, 'FD');

      doc.setDrawColor(7, 62, 35);
      doc.setLineWidth(0.18);
      doc.rect(margin + 0.8, margin + 0.8, contentWidth - 1.6, 18.4);

      if (logo) {
        doc.addImage(logo, 'PNG', margin + 2.5, margin + 2.2, 39, 15, undefined, 'FAST');
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(0, 139, 71);
        doc.text('PREVIASIS', margin + 3, margin + 10.5);
      }

      const companyInfoX = margin + 44;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(7, 62, 35);
      doc.text('PREVIASIS MEDICINA PREPAGADA S.A.', companyInfoX, margin + 5.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(0, 139, 71);
      doc.text('R.I.F. J-412048970', companyInfoX, margin + 8.7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(71, 85, 105);
      doc.text('Inscrita en la Superintendencia de la Actividad Aseguradora bajo el Nº MP-000015', companyInfoX, margin + 12.2);
      doc.text('Providencia Administrativa Nº SAA-09-1585 de fecha 04 de Marzo de 2026', companyInfoX, margin + 15.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(11, 43, 64);
      doc.text('SOLICITUD DE AFILIACIÓN', pageWidth - margin - 4, margin + 7, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Nº Solicitud: ${data.header.applicationNumber || 'EMISIÓN DIRECTA'}`, pageWidth - margin - 4, margin + 12, { align: 'right' });
    };

    const drawPageFooter = (pageNum: number, totalPages: number) => {
      // El número de página se dibuja en la zona superior derecha de la cabecera,
      // pero su total solo se conoce al final: se imprime en una pasada final.
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 4, margin + 16.5, { align: 'right' });

      const footerY = pageHeight - margin - 3;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3.5, pageWidth - margin, footerY - 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Aprobado por la Superintendencia de la Actividad Aseguradora según Providencia Administrativa Nº SAA-09-1585 de fecha 04 de Marzo de 2026.',
        margin,
        footerY - 0.5
      );
      doc.text(
        'PREVIASIS MEDICINA PREPAGADA S.A. Sede Principal: Av. Pedro León Torres con calle 52A. Barquisimeto, Lara.',
        margin,
        footerY + 2.5
      );
    };

    const drawSectionTitle = (title: string, y: number): number => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 5.2, 'F');

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, contentWidth, 5.2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), margin + 3, y + 3.8);
      return y + 5.5;
    };

    const drawCheckbox = (label: string, isChecked: boolean, x: number, y: number): number => {
      const boxSize = 3.4;
      const boxY = y - boxSize / 2;
      const textY = y + 0.7;

      doc.setDrawColor(7, 62, 35);
      doc.setLineWidth(0.25);
      doc.rect(x, boxY, boxSize, boxSize);

      if (isChecked) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 139, 71);
        doc.text('X', x + 0.9, y + 0.9);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(label, x + boxSize + 2.2, textY);
      return x + boxSize + 2.2 + doc.getTextWidth(label) + 4;
    };

    const drawCell = (label: string, value: string, x: number, y: number, w: number, h?: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const lines = doc.splitTextToSize(value || '-', w - 3);

      const cellHeight = h ?? Math.max(8.5, 8.5 + (lines.length - 1) * 3.4);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(x, y, w, cellHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(7, 62, 35);
      doc.text(label.toUpperCase(), x + 1.5, y + 2.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      lines.forEach((line: string, index: number) => {
        doc.text(line || '-', x + 1.5, y + 6.5 + index * 3.4);
      });
    };

    const startNewPage = () => {
      doc.addPage();
      currentY = margin + 22;
      drawPageHeader();
    };

    const ensureSpace = (requiredHeight: number) => {
      if (currentY + requiredHeight > contentBottomLimit) {
        startNewPage();
      }
    };

    const computeCellHeight = (value: string, w: number): number => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      const lines = doc.splitTextToSize(value || '-', w - 3);
      return Math.max(8.5, 8.5 + (lines.length - 1) * 3.4);
    };

    const drawRow = (
      cells: PdfTableCell[],
      sexCell?: { value: string; x: number; w: number },
    ) => {
      const heights = cells.map((cell) => computeCellHeight(cell.value, cell.w));
      const rowHeight = Math.max(8.5, ...heights);
      ensureSpace(rowHeight);
      cells.forEach((cell) => drawCell(cell.label, cell.value, cell.x, currentY, cell.w, rowHeight));
      if (sexCell) {
        drawSexCell(sexCell.value, sexCell.x, currentY, sexCell.w, rowHeight);
      }
      currentY += rowHeight;
    };

    const drawSexCell = (sex: string, x: number, y: number, w: number, h: number) => {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(x, y, w, h);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(7, 62, 35);
      doc.text('SEXO', x + 1.3, y + 2.4);

      const circleX = x + w / 2;
      const circleY = y + h / 2 + 1;
      const radius = 3.5;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.circle(circleX, circleY, radius, 'S');

      if (sex && sex.toUpperCase() === 'M') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('M', circleX - 1.5, circleY + 2.5);
      } else if (sex && sex.toUpperCase() === 'F') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('F', circleX - 1.5, circleY + 2.5);
      }
    };

    drawPageHeader();
    let currentY = margin + 22;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.18);
    doc.rect(margin, currentY, contentWidth, 7, 'D');

    let checkboxX = margin + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 62, 35);
    doc.text('Operación:', checkboxX, currentY + 4.5);
    checkboxX += 16;
    checkboxX = drawCheckbox('Emisión', data.header.operationType === 'Emisión', checkboxX, currentY + 4.5);
    checkboxX = drawCheckbox('Inclusión', data.header.operationType === 'Inclusión', checkboxX, currentY + 4.5);

    checkboxX += 8;
    doc.text('Contrato:', checkboxX, currentY + 4.5);
    checkboxX += 14;
    checkboxX = drawCheckbox('Individual', data.header.contractType === 'Individual', checkboxX, currentY + 4.5);
    checkboxX = drawCheckbox('Colectivo', data.header.contractType === 'Colectivo', checkboxX, currentY + 4.5);

    doc.text(`Fecha: ${formatPdfDate(data.header.applicationDate)}`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });
    currentY += 8.5;

    currentY = drawSectionTitle('Datos del Propuesto Afiliado Titular', currentY);
    const policyholderData = data.policyholder;
    const halfW = contentWidth / 2;
    const thirdW = contentWidth / 3;
    const fourthW = contentWidth / 4;

    const w1 = contentWidth * 0.18;
    const w2 = contentWidth * 0.18;
    const w3 = contentWidth * 0.13;
    const w4 = contentWidth * 0.13;
    const w5 = contentWidth * 0.13;
    const w6 = contentWidth * 0.13;
    const w7 = contentWidth * 0.12;

    drawRow([
      { label: 'Nombres', value: policyholderData.firstNames, x: margin, w: w1 },
      { label: 'Apellidos', value: policyholderData.lastNames, x: margin + w1, w: w2 },
      { label: 'C.I. / Pasaporte', value: `${policyholderData.documentType}-${policyholderData.documentNumber}`, x: margin + w1 + w2, w: w3 },
      { label: 'R.I.F.', value: `${policyholderData.taxIdType}-${policyholderData.taxId}`, x: margin + w1 + w2 + w3, w: w4 },
      { label: 'Nacionalidad', value: policyholderData.nationality, x: margin + w1 + w2 + w3 + w4, w: w5 },
      { label: 'Edo. Civil', value: policyholderData.maritalStatus, x: margin + w1 + w2 + w3 + w4 + w5, w: w6 },
    ], {
      value: policyholderData.sex,
      x: margin + w1 + w2 + w3 + w4 + w5 + w6,
      w: w7,
    });

    const secondRowWidth = contentWidth / 4;
    drawRow([
      { label: 'Lugar de Nacimiento', value: policyholderData.birthPlace, x: margin, w: secondRowWidth },
      { label: 'Fecha Nacimiento', value: formatPdfDate(policyholderData.birthDate), x: margin + secondRowWidth, w: secondRowWidth },
      { label: 'Profesión', value: policyholderData.profession, x: margin + secondRowWidth * 2, w: secondRowWidth },
      { label: 'Ocupación', value: policyholderData.occupation, x: margin + secondRowWidth * 3, w: secondRowWidth },
    ]);

    const incomeWidth = contentWidth * 0.25;
    const politicallyExposedWidth = contentWidth * 0.40;
    const classificationWidth = contentWidth - incomeWidth - politicallyExposedWidth;
    drawRow([
      { label: 'Ingreso Anual / Mensual', value: policyholderData.annualIncomeBs, x: margin, w: incomeWidth },
      {
        label: 'Persona Expuesta Políticamente (PEP)',
        value: `${policyholderData.politicallyExposed}${policyholderData.politicallyExposed === 'SÍ' && policyholderData.politicallyExposedDescription ? ` (${policyholderData.politicallyExposedDescription})` : ''}`,
        x: margin + incomeWidth,
        w: politicallyExposedWidth,
      },
      { label: 'Clasificación Actividad', value: policyholderData.activityClassification, x: margin + incomeWidth + politicallyExposedWidth, w: classificationWidth },
    ]);

    if (policyholderData.activityClassification === 'Dependiente' && policyholderData.company) {
      drawRow([
        { label: 'Empresa donde labora', value: policyholderData.company, x: margin, w: contentWidth },
      ]);
    }

    const residenceRow = [
      { label: 'Estado', value: policyholderData.residenceState || '-', x: margin, w: halfW },
      { label: 'Ciudad', value: policyholderData.residenceCity || '-', x: margin + halfW, w: halfW },
    ];
    drawRow(residenceRow);

    const addressRow = [
      { label: 'Dirección de Residencia / Habitación', value: policyholderData.homeAddress, x: margin, w: contentWidth * 0.5 },
      { label: 'Dirección de Oficina / Trabajo', value: policyholderData.officeAddress, x: margin + contentWidth * 0.5, w: contentWidth * 0.5 },
    ];
    drawRow(addressRow);

    const billingWidth = contentWidth * 0.20;
    const homePhoneWidth = contentWidth * 0.20;
    const mobilePhoneWidth = contentWidth * 0.20;
    const emailWidth = contentWidth - billingWidth - homePhoneWidth - mobilePhoneWidth;
    const contactRow = [
      { label: 'Dirección de Cobro', value: policyholderData.billingAddress, x: margin, w: billingWidth },
      { label: 'Teléfono Habitación', value: policyholderData.homePhone, x: margin + billingWidth, w: homePhoneWidth },
      { label: 'Teléfono Móvil', value: policyholderData.mobilePhone, x: margin + billingWidth + homePhoneWidth, w: mobilePhoneWidth },
      { label: 'Correo Electrónico', value: policyholderData.email, x: margin + billingWidth + homePhoneWidth + mobilePhoneWidth, w: emailWidth },
    ];
    drawRow(contactRow);
    currentY += 2;


    const contractorData = data.contractor;
    currentY = drawSectionTitle('Datos del Contratante', currentY);

    const isLegalEntityContractor =
      contractorData.isDifferent && contractorData.personType === 'Juridica';

    // Cuando el contratante NO es una persona diferente, sus campos se replican
    // desde el titular porque el formulario deja naturalPerson vacio.
    const contractorPerson: NaturalPersonData = contractorData.isDifferent
      ? contractorData.naturalPerson
      : data.policyholder;

    const drawContractorSubTitle = (title: string) => {
      ensureSpace(5);
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(margin, currentY, contentWidth, 5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(7, 62, 35);
      doc.text(title.toUpperCase(), margin + 2.5, currentY + 3.4);
      currentY += 5.5;
    };

    const buildNaturalPersonRows = (person: NaturalPersonData): PdfTableCell[][] => {
      const contractorNationalityWidth = contentWidth * 0.17;
      const contractorMaritalStatusWidth = contentWidth * 0.17;
      const contractorSexWidth = contentWidth * 0.12;
      const contractorBirthDateWidth = contentWidth * 0.18;
      const contractorBirthPlaceWidth = contentWidth - contractorNationalityWidth - contractorMaritalStatusWidth - contractorSexWidth - contractorBirthDateWidth;

      const contractorProfessionWidth = contentWidth * 0.25;
      const contractorOccupationWidth = contentWidth * 0.25;
      const contractorIncomeWidth = contentWidth * 0.20;
      const contractorPoliticallyExposedWidth = contentWidth * 0.15;
      const contractorActivityWidth = contentWidth - contractorProfessionWidth - contractorOccupationWidth - contractorIncomeWidth - contractorPoliticallyExposedWidth;

      const rows: PdfTableCell[][] = [
        [
          { label: 'Nombres y Apellidos Contratante', value: `${person.firstNames} ${person.lastNames}`, x: margin, w: halfW },
          { label: 'C.I. / Pasaporte', value: `${person.documentType}-${person.documentNumber}`, x: margin + halfW, w: fourthW },
          { label: 'R.I.F.', value: `${person.taxIdType}-${person.taxId}`, x: margin + halfW + fourthW, w: fourthW },
        ],
        [
          { label: 'Nacionalidad', value: person.nationality, x: margin, w: contractorNationalityWidth },
          { label: 'Estado Civil', value: person.maritalStatus, x: margin + contractorNationalityWidth, w: contractorMaritalStatusWidth },
          { label: 'Sexo', value: person.sex, x: margin + contractorNationalityWidth + contractorMaritalStatusWidth, w: contractorSexWidth },
          { label: 'Fecha de Nacimiento', value: formatPdfDate(person.birthDate), x: margin + contractorNationalityWidth + contractorMaritalStatusWidth + contractorSexWidth, w: contractorBirthDateWidth },
          { label: 'Lugar de Nacimiento', value: person.birthPlace, x: margin + contractorNationalityWidth + contractorMaritalStatusWidth + contractorSexWidth + contractorBirthDateWidth, w: contractorBirthPlaceWidth },
        ],
        [
          { label: 'Profesión', value: person.profession, x: margin, w: contractorProfessionWidth },
          { label: 'Ocupación', value: person.occupation, x: margin + contractorProfessionWidth, w: contractorOccupationWidth },
          { label: 'Ingreso Anual (Bs.)', value: person.annualIncomeBs, x: margin + contractorProfessionWidth + contractorOccupationWidth, w: contractorIncomeWidth },
          { label: 'PEP', value: `${person.politicallyExposed}${person.politicallyExposed === 'SÍ' && person.politicallyExposedDescription ? `: ${person.politicallyExposedDescription}` : ''}`, x: margin + contractorProfessionWidth + contractorOccupationWidth + contractorIncomeWidth, w: contractorPoliticallyExposedWidth },
          { label: 'Actividad', value: person.activityClassification, x: margin + contractorProfessionWidth + contractorOccupationWidth + contractorIncomeWidth + contractorPoliticallyExposedWidth, w: contractorActivityWidth },
        ],
      ];

      if (person.activityClassification === 'Dependiente' && person.company) {
        rows.push(
          [
            { label: 'Empresa donde labora', value: person.company, x: margin, w: halfW },
            { label: 'Dirección de Habitación', value: person.homeAddress, x: margin + halfW, w: fourthW },
            { label: 'Dirección de Oficina', value: person.officeAddress, x: margin + halfW + fourthW, w: fourthW },
          ],
          [
            { label: 'Dirección de Cobro', value: person.billingAddress, x: margin, w: halfW },
            { label: 'Teléfono Habitación', value: person.homePhone, x: margin + halfW, w: fourthW },
            { label: 'Teléfono Móvil', value: person.mobilePhone, x: margin + halfW + fourthW, w: fourthW },
          ],
          [
            { label: 'Correo Electrónico', value: person.email, x: margin, w: contentWidth },
          ],
        );
      } else {
        rows.push(
          [
            { label: 'Dirección de Habitación', value: person.homeAddress, x: margin, w: halfW },
            { label: 'Dirección de Oficina', value: person.officeAddress, x: margin + halfW, w: fourthW },
            { label: 'Dirección de Cobro', value: person.billingAddress, x: margin + halfW + fourthW, w: fourthW },
          ],
          [
            { label: 'Teléfono Local', value: person.homePhone, x: margin, w: contentWidth * 0.20 },
            { label: 'Teléfono Móvil', value: person.mobilePhone, x: margin + contentWidth * 0.20, w: contentWidth * 0.20 },
            { label: 'Correo Electrónico', value: person.email, x: margin + contentWidth * 0.40, w: contentWidth * 0.60 },
          ],
        );
      }

      return rows;
    };

    const buildLegalEntityRows = (values: LegalEntityRowValues): PdfTableCell[][] => {
      const companyNameWidth = contentWidth * 0.34;
      const companyRifWidth = contentWidth * 0.20;
      const companyRegistryWidth = contentWidth * 0.22;
      const companyVolumeWidth = contentWidth - companyNameWidth - companyRifWidth - companyRegistryWidth;

      const companyRegistrationDateWidth = contentWidth * 0.20;
      const companyActivityWidth = contentWidth * 0.22;
      const companySectorWidth = contentWidth * 0.20;
      const companyPhoneWidth = contentWidth * 0.18;
      const companyProfitWidth = contentWidth - companyRegistrationDateWidth - companyActivityWidth - companySectorWidth - companyPhoneWidth;

      const companyNetWorthWidth = contentWidth * 0.25;
      const companyProductsWidth = contentWidth - companyNetWorthWidth;

      const naNationalityWidth = contentWidth * 0.17;
      const naMaritalStatusWidth = contentWidth * 0.17;
      const naSexWidth = contentWidth * 0.12;
      const naBirthDateWidth = contentWidth * 0.18;
      const naBirthPlaceWidth = contentWidth * 0.18;
      const naIncomeWidth = contentWidth - naNationalityWidth - naMaritalStatusWidth - naSexWidth - naBirthDateWidth - naBirthPlaceWidth;

      return [
        [
          { label: 'Razón Social', value: values.razonSocial, x: margin, w: companyNameWidth },
          { label: 'R.I.F.', value: values.rif, x: margin + companyNameWidth, w: companyRifWidth },
          { label: 'Nº Registro Mercantil', value: values.registroMercantil, x: margin + companyNameWidth + companyRifWidth, w: companyRegistryWidth },
          { label: 'Volumen / Tomo', value: values.volumenTomo, x: margin + companyNameWidth + companyRifWidth + companyRegistryWidth, w: companyVolumeWidth },
        ],
        [
          { label: 'Fecha de Registro', value: values.fechaRegistro, x: margin, w: companyRegistrationDateWidth },
          { label: 'Actividad Económica', value: values.actividadEconomica, x: margin + companyRegistrationDateWidth, w: companyActivityWidth },
          { label: 'Sector', value: values.sector, x: margin + companyRegistrationDateWidth + companyActivityWidth, w: companySectorWidth },
          { label: 'Teléfono', value: values.telefono, x: margin + companyRegistrationDateWidth + companyActivityWidth + companySectorWidth, w: companyPhoneWidth },
          { label: 'Utilidad Ejercicio Anterior', value: values.utilidadEjercicioAnterior, x: margin + companyRegistrationDateWidth + companyActivityWidth + companySectorWidth + companyPhoneWidth, w: companyProfitWidth },
        ],
        [
          { label: 'Patrimonio Neto', value: values.patrimonioNeto, x: margin, w: companyNetWorthWidth },
          { label: 'Productos / Servicios', value: values.productosServicios, x: margin + companyNetWorthWidth, w: companyProductsWidth },
        ],
        [
          { label: 'Dirección Fiscal', value: values.direccionFiscal, x: margin, w: contentWidth },
        ],
        [
          { label: 'Nacionalidad', value: NOT_APPLICABLE, x: margin, w: naNationalityWidth },
          { label: 'Estado Civil', value: NOT_APPLICABLE, x: margin + naNationalityWidth, w: naMaritalStatusWidth },
          { label: 'Sexo', value: NOT_APPLICABLE, x: margin + naNationalityWidth + naMaritalStatusWidth, w: naSexWidth },
          { label: 'Fecha de Nacimiento', value: NOT_APPLICABLE, x: margin + naNationalityWidth + naMaritalStatusWidth + naSexWidth, w: naBirthDateWidth },
          { label: 'Lugar de Nacimiento', value: NOT_APPLICABLE, x: margin + naNationalityWidth + naMaritalStatusWidth + naSexWidth + naBirthDateWidth, w: naBirthPlaceWidth },
          { label: 'Ingreso Anual (Bs.)', value: NOT_APPLICABLE, x: margin + naNationalityWidth + naMaritalStatusWidth + naSexWidth + naBirthDateWidth + naBirthPlaceWidth, w: naIncomeWidth },
        ],
      ];
    };

    const buildLegalEntityRowsFromEntity = (entity: LegalEntityData): PdfTableCell[][] =>
      buildLegalEntityRows({
        razonSocial: entity.legalName,
        rif: `${entity.taxIdType}-${entity.taxId}`,
        registroMercantil: entity.commercialRegistryNumber,
        volumenTomo: entity.volumeNumber,
        fechaRegistro: entity.registrationDate,
        actividadEconomica: entity.economicActivity,
        sector: entity.businessSector || NOT_APPLICABLE,
        telefono: entity.phone,
        utilidadEjercicioAnterior: entity.previousFiscalYearProfit,
        patrimonioNeto: entity.netWorth,
        productosServicios: entity.productsServices,
        direccionFiscal: entity.taxAddress,
      });

    const estimateRowsHeight = (rows: PdfTableCell[][]): number =>
      rows.reduce(
        (total, row) => total + Math.max(...row.map((cell) => computeCellHeight(cell.value, cell.w))),
        0,
      );

    const drawContractorNaturalPerson = (person: NaturalPersonData) => {
      buildNaturalPersonRows(person).forEach((row) => drawRow(row));
      currentY += 2;
    };

    const drawContractorLegalEntity = (entity: LegalEntityData) => {
      drawContractorSubTitle('Datos de la Empresa Contratante');
      buildLegalEntityRowsFromEntity(entity).forEach((row) => drawRow(row));
      currentY += 2;
      drawContractorSubTitle('Datos del Representante Legal');
      drawContractorNaturalPerson(entity.legalRepresentative);
    };

    const estimatedContractorHeight = isLegalEntityContractor
      ? 5.5
        + estimateRowsHeight(buildLegalEntityRowsFromEntity(contractorData.legalEntity)) + 2
        + 5.5
        + estimateRowsHeight(buildNaturalPersonRows(contractorData.legalEntity.legalRepresentative)) + 2
      : estimateRowsHeight(buildNaturalPersonRows(contractorPerson))
        + 2
        + estimateRowsHeight(buildLegalEntityRows(LEGAL_ENTITY_NA_VALUES))
        + 2;

    ensureSpace(estimatedContractorHeight);

    if (isLegalEntityContractor) {
      drawContractorLegalEntity(contractorData.legalEntity);
    } else {
      drawContractorNaturalPerson(contractorPerson);
      buildLegalEntityRows(LEGAL_ENTITY_NA_VALUES).forEach((row) => drawRow(row));
      currentY += 2;
    }

    ensureSpace(52);
    currentY = drawSectionTitle('Personas a Afiliar y Plan Solicitado', currentY);

    const colWidths = [8, 50, 22, 20, 20, 12, 16, 25, 22.9];
    const headers = ['Nº', 'Nombres y Apellidos', 'C.I. / R.I.F.', 'F. Nac.', 'Parentesco', 'Sexo', 'P(kg)/E(cm)', 'Plan Solicitado', 'Límite Cobertura'];

    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.18);
    doc.rect(margin, currentY, contentWidth, 5.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(7, 62, 35);

    let curX = margin;
    headers.forEach((h, i) => {
      doc.text(h, curX + 1.5, currentY + 3.8);
      curX += colWidths[i];
    });
    currentY += 5.5;

    data.affiliates.slice(0, 6).forEach((af, idx) => {
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, currentY, contentWidth, 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);

      let rowX = margin;
      doc.text(String(af.affiliateCode || idx + 1), rowX + 2.5, currentY + 4.5);
      rowX += colWidths[0];
      doc.text(doc.splitTextToSize(af.fullName || '-', colWidths[1] - 2)[0] || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[1];
      doc.text(formatAffiliateDocumentForPdf(af, data.affiliates), rowX + 1.5, currentY + 4.5);
      rowX += colWidths[2];
      doc.text(formatPdfDate(af.birthDate), rowX + 1.5, currentY + 4.5);
      rowX += colWidths[3];
      doc.text(af.relationship || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[4];
      doc.text(af.sex || '-', rowX + 3.5, currentY + 4.5);
      rowX += colWidths[5];
      doc.text(`${af.weightKg || '-'}/${af.heightCm || '-'}`, rowX + 1.5, currentY + 4.5);
      rowX += colWidths[6];
      const legalRequestedPlan = af.requestedPlan === 'Abuelos'
        ? 'Abuelos'
        : af.requestedPlan
          ? 'Previasis'
          : '-';
      doc.text(legalRequestedPlan, rowX + 1.5, currentY + 4.5);
      rowX += colWidths[7];
      const coverageLimit = Number(af.coverageLimit);
      const formattedCoverage = Number.isFinite(coverageLimit) && coverageLimit > 0
        ? `$${coverageLimit.toLocaleString('es-VE')}`
        : '-';
      doc.text(
        doc.splitTextToSize(formattedCoverage, colWidths[8] - 3)[0] || '-',
        rowX + 1.5,
        currentY + 4.5,
      );

      currentY += 6.5;
    });

    startNewPage();

    const colCodeW = 22;
    const colHealthW = pageWidth - margin * 2;
    const colQuestionW = colHealthW - colCodeW;

    doc.setFillColor(226, 232, 240);
    doc.rect(margin, currentY, colHealthW, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, colHealthW, 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.3);
    doc.setTextColor(7, 62, 35);
    const healthDeclarationTitle = 'DECLARACIÓN DE SALUD : Usted o algún dependiente, ha(n) padecido o padece(n), o como consecuencia de algún accidente ha tenido alguna de las siguientes dolencias o enfermedades que se indican a continuación: Marque con una "X" la casilla que corresponda y en caso afirmativo subraye la enfermedad o dolencia que padezca o haya padecido e indique el código o (los) número(s) correspondiente(s) al (los) Afiliado(s)';
    const titleLines = doc.splitTextToSize(healthDeclarationTitle, colQuestionW - 4);
    doc.text(titleLines, margin + 2, currentY + 3);
    doc.text('Código del Afiliado', margin + colQuestionW + 2, currentY + 3);
    currentY += 8;

    const lineHeight = 4.8;

    // Las preguntas 25 y 26 se imprimen juntas en "OTROS CONTRATOS DE SALUD".
    HEALTH_QUESTIONS.filter((q) => !OFFICIAL_DECLARATION_QUESTION_IDS.includes(q.id)).forEach((q) => {
      const answer = data.healthDeclaration.questions[q.id]?.answer || 'NO';
      const extra = data.healthDeclaration.questions[q.id]?.extraDetails;
      const antecedent = data.healthDeclaration.questions[q.id]?.antecedentDetail;
      const affiliateCodes = data.healthDeclaration.questions[q.id]?.affiliateCodes || [];
      const isYes = answer === 'SÍ';

      const questionTitle = `${q.id}. ${q.title}`;
      const questionDescription = q.description || '';

      const fullText = questionTitle + ': ' + questionDescription;

      const yesCheckboxWidth = doc.getTextWidth('SÍ') + 3.2 + 2.5;
      const noCheckboxWidth = doc.getTextWidth('NO') + 3.2 + 2.5;
      const checkboxGap = 4;
      const totalCheckboxWidth = yesCheckboxWidth + checkboxGap + noCheckboxWidth;
      const checkboxMargin = 3;
      const textWidth = colQuestionW - totalCheckboxWidth - checkboxMargin - 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.0);
      const wrappedLines = doc.splitTextToSize(fullText, textWidth);
      const antecedentLines = isYes && q.antecedentFields
        ? [
            `${q.antecedentFields.field1Label}: ${antecedent?.field1 || '-'}`,
            `${q.antecedentFields.field2Label}: ${antecedent?.field2 || '-'}`,
          ].flatMap((line) => doc.splitTextToSize(line, colQuestionW - 8))
        : [];
      const codesText = affiliateCodes.length
        ? affiliateCodes.map((codigo) => `#${codigo}`).join(', ')
        : '-';
      const codeLines = doc.splitTextToSize(codesText, colCodeW - 4);

      const lineCount = wrappedLines.length;
      const extraLineCount = isYes && extra ? 1 : 0;
      const dynamicRowHeight = Math.max(
        7,
        (lineCount + extraLineCount + antecedentLines.length) * lineHeight + 3,
        codeLines.length * lineHeight + 3,
      );

      ensureSpace(dynamicRowHeight);

      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, currentY, colHealthW, dynamicRowHeight);


      wrappedLines.forEach((line: any, idx: number) => {
        const textY = currentY + 2.5 + idx * lineHeight;
        if (idx === 0) {
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const lineTitle = line.substring(0, colonIndex + 1);
            const lineDescription = line.substring(colonIndex + 1);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.0);
            doc.setTextColor(isYes ? 0 : 7, isYes ? 139 : 62, isYes ? 71 : 35);
            doc.text(lineTitle, margin + 2, textY);
            const descriptionX = margin + 2 + doc.getTextWidth(lineTitle);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.0);
            doc.setTextColor(71, 85, 105);
            doc.text(lineDescription, descriptionX, textY);
          } else {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.0);
            doc.setTextColor(isYes ? 0 : 7, isYes ? 139 : 62, isYes ? 71 : 35);
            doc.text(line, margin + 2, textY);
          }
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.0);
          doc.setTextColor(71, 85, 105);
          doc.text(line, margin + 2, textY);
        }
      });

      let detailY = currentY + 2.5 + lineCount * lineHeight;
      if (isYes && extra) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.2);
        doc.setTextColor(0, 139, 71);
        const extraText = `${extra.substring(0, 60)}${extra.length > 60 ? '…' : ''}`;
        doc.text(extraText, margin + 2, detailY);
        detailY += lineHeight;
      }

      if (antecedentLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(71, 85, 105);
        antecedentLines.forEach((line, idx) => {
          doc.text(line, margin + 2, detailY + idx * lineHeight);
        });
      }


      const finalCheckboxY = currentY + dynamicRowHeight / 2;

      const checkStartX = margin + colQuestionW - totalCheckboxWidth - checkboxMargin;
      drawCheckbox('SÍ', isYes, checkStartX, finalCheckboxY);
      drawCheckbox('NO', !isYes, checkStartX + yesCheckboxWidth + checkboxGap, finalCheckboxY);

      doc.setDrawColor(203, 213, 225);
      doc.line(
        margin + colQuestionW,
        currentY,
        margin + colQuestionW,
        currentY + dynamicRowHeight,
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.0);
      doc.setTextColor(15, 23, 42);
      codeLines.forEach((line: string, idx: number) => {
        doc.text(line, margin + colQuestionW + 2, currentY + 2.5 + idx * lineHeight);
      });

      currentY += dynamicRowHeight;
    });


    const beneficiaryConditions = HEALTH_QUESTIONS
      .filter((questionConfig) => questionConfig.includeInClinicalSummary)
      .flatMap((questionConfig) => {
        const question = data.healthDeclaration.questions[questionConfig.id];
        if (question?.answer !== 'SÍ') return [];

        return (data.healthDeclaration.clarificationDetails?.[questionConfig.id] || [])
          .map((detail, index) => ({
            id: detail.id || `clinical-summary-${questionConfig.id}-${index}`,
            questionId: questionConfig.id,
            affiliateCode: detail.affiliateCode,
            condition: detail.field1,
            diagnosisDate: detail.field2,
            treatment: '',
            lastCheckupDate: '',
            hospital: '',
          }));
      });
    const conditions = [
      ...(data.healthDeclaration.medicalConditionDetails || []),
      ...beneficiaryConditions,
    ];

    if (conditions.length > 0) {
      const rowHeight = 6.5;
      const headerHeight = 11;

      const renderConditionsHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(7, 62, 35);
        doc.text('DETALLE CLÍNICO DE AFECCIONES MÉDICAS DECLARADAS CON "SÍ"', margin + 3, currentY + 3.5);
        currentY += 5;
        const conditionColumnWidths = [16, 42, 28, 42, 28, 39.9];
        const conditionHeaders = [
          'Cód. af.',
          'Tipo Padecimiento',
          'Fecha Diag.',
          'Tratamiento / Quirúrgica',
          'Fecha Últ. Cheq.',
          'Institución Hospitalaria',
        ];

        doc.setFillColor(226, 232, 240);
        doc.rect(margin, currentY, contentWidth, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(7, 62, 35);

        let conditionCurrentX = margin;
        conditionHeaders.forEach((h, i) => {
          doc.text(h, conditionCurrentX + 1.5, currentY + 3.5);
          conditionCurrentX += conditionColumnWidths[i];
        });
        currentY += 5;

        return conditionColumnWidths;
      };

      if (currentY + headerHeight + rowHeight > contentBottomLimit) {
        startNewPage();
      } else {
        currentY += 3;
      }
      let conditionColumnWidths = renderConditionsHeader();
      conditions.forEach((af) => {

        ensureSpace(rowHeight);


        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(15, 23, 42);

        let rowX = margin;

        doc.text(`#${af.affiliateCode || 1}`, rowX + 1.5, currentY + 4.2);
        rowX += conditionColumnWidths[0];

        doc.text(
          doc.splitTextToSize(af.condition || '-', conditionColumnWidths[1] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );
        rowX += conditionColumnWidths[1];

        doc.text(formatPdfDate(af.diagnosisDate), rowX + 1.5, currentY + 4.2);
        rowX += conditionColumnWidths[2];

        doc.text(
          doc.splitTextToSize(af.treatment || '-', conditionColumnWidths[3] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );
        rowX += conditionColumnWidths[3];

        doc.text(formatPdfDate(af.lastCheckupDate), rowX + 1.5, currentY + 4.2);
        rowX += conditionColumnWidths[4];

        doc.text(
          doc.splitTextToSize(af.hospital || '-', conditionColumnWidths[5] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );

        currentY += rowHeight;
      });

      currentY += 2;
    }

    const question17 = data.healthDeclaration.questions[17] || data.healthDeclaration.questions['17'];
    const hasSports = question17?.answer === 'SÍ';
    const sportDetails = data.healthDeclaration.sportDetails || [];

    if (hasSports && sportDetails.length > 0) {
      const estimatedHeight = 15 + sportDetails.length * 6;

      if (currentY + estimatedHeight > contentBottomLimit) {
        startNewPage();
      } else {
        currentY += 3;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(7, 62, 35);
      doc.text('DETALLE DE PRÁCTICA DEPORTIVA DECLARADA (PREGUNTA N° 17)', margin + 3, currentY + 3.5);
      currentY += 5;

      const sportColumnWidths = [25, 65, 65, 40.9];
      const sportHeaders = ['Código Afiliado', 'Deporte Practicado', 'Frecuencia / Rutina', 'Nivel de Práctica'];

      doc.setFillColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, 5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(7, 62, 35);

      let sportCurrentX = margin;
      sportHeaders.forEach((h, i) => {
        doc.text(h, sportCurrentX + 1.5, currentY + 3.5);
        sportCurrentX += sportColumnWidths[i];
      });
      currentY += 5;

      sportDetails.forEach((dep) => {
        const rowHeight = 6;
        ensureSpace(rowHeight);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(15, 23, 42);

        let rowX = margin;
        doc.text(`#${dep.affiliateCode}`, rowX + 2, currentY + 4);
        rowX += sportColumnWidths[0];

        doc.text(doc.splitTextToSize(dep.sport || '-', sportColumnWidths[1] - 2)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += sportColumnWidths[1];

        const monthlyFrequency = dep.frequency.replace(/\D/g, '');
        const frequencyText = monthlyFrequency ? `${monthlyFrequency} veces por mes` : '-';
        doc.text(doc.splitTextToSize(frequencyText, sportColumnWidths[2] - 2)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += sportColumnWidths[2];

        doc.text(dep.level || '-', rowX + 1.5, currentY + 4);

        currentY += rowHeight;
      });

      currentY += 2;
    }

    const renderBeneficiaryDetails = (
      questionConfig: (typeof HEALTH_QUESTIONS)[number],
    ) => {
      const questionId = questionConfig.id;
      const question = data.healthDeclaration.questions[questionId];
      const details = data.healthDeclaration.clarificationDetails?.[questionId] || [];

      if (question?.answer !== 'SÍ' || details.length === 0) return;

      const rowHeight = 6;
      const estimatedHeight = 12 + details.length * rowHeight;
      if (currentY + estimatedHeight > contentBottomLimit) {
        startNewPage();
      } else {
        currentY += 3;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(7, 62, 35);
      doc.text(
        `DETALLE DE ${questionConfig.title.toUpperCase()} (PREGUNTA N° ${questionId})`,
        margin + 3,
        currentY + 3.5,
      );
      currentY += 5;

      const detailColWidths = [28, 76, contentWidth - 104];
      const detailHeaders = [
        'Código Afiliado',
        questionConfig.beneficiaryDetailLabels?.field1 || 'Detalle 1',
        questionConfig.beneficiaryDetailLabels?.field2 || 'Detalle 2',
      ];
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, 5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(7, 62, 35);

      let headerX = margin;
      detailHeaders.forEach((header, index) => {
        doc.text(header, headerX + 1.5, currentY + 3.5);
        headerX += detailColWidths[index];
      });
      currentY += 5;

      details.forEach((detail) => {
        ensureSpace(rowHeight);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, rowHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(15, 23, 42);

        const formattedDetail = questionId === 21
          ? (() => {
              const doseText = detail.field2?.trim() || '-';
              const frequencyValue = detail.field2Number?.trim();
              const frequencyUnit = detail.field2Unit?.trim().toLowerCase();
              if (doseText === '-' || !frequencyValue || !frequencyUnit) return doseText;

              const normalizedNumber = Number(frequencyValue);
              if (Number.isNaN(normalizedNumber) || normalizedNumber <= 0) return doseText;

              const isSingular = normalizedNumber === 1;
              const unitMap: Record<string, { singular: string; plural: string }> = {
                minuto: { singular: 'minuto', plural: 'minutos' },
                hora: { singular: 'hora', plural: 'horas' },
                semana: { singular: 'semana', plural: 'semanas' },
                mes: { singular: 'mes', plural: 'meses' },
                dia: { singular: 'día', plural: 'días' },
              };

              const unitText = unitMap[frequencyUnit]?.[isSingular ? 'singular' : 'plural'] || frequencyUnit;
              return `${doseText} cada ${frequencyValue} ${unitText}`;
            })()
          : (detail.field2 || '-');

        let rowX = margin;
        doc.text(`#${detail.affiliateCode}`, rowX + 2, currentY + 4);
        rowX += detailColWidths[0];
        doc.text(doc.splitTextToSize(detail.field1 || '-', detailColWidths[1] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += detailColWidths[1];
        doc.text(doc.splitTextToSize(formattedDetail, detailColWidths[2] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        currentY += rowHeight;
      });

      currentY += 2;
    };

    HEALTH_QUESTIONS
      .filter((question) =>
        question.beneficiaryDetail &&
        question.id !== 17 &&
        !question.includeInClinicalSummary,
      )
      .forEach(renderBeneficiaryDetails);

    const officialDeclarationQuestions = OFFICIAL_DECLARATION_QUESTION_IDS.flatMap((questionId) => {
      const question = HEALTH_QUESTIONS.find((candidate) => candidate.id === questionId);
      return question ? [question] : [];
    });

    /** Caja "OTROS CONTRATOS DE SALUD": pregunta oficial + checkboxes SÍ/NO + tabla por contrato. */
    const getAntecedentEntries = (questionId: number): AntecedentDetail[] => {
      const questionData = data.healthDeclaration.questions[questionId];
      return (
        questionData?.antecedentDetails ||
        (questionData?.antecedentDetail ? [questionData.antecedentDetail] : [])
      );
    };

    const measureAntecedentQuestion = (question: (typeof HEALTH_QUESTIONS)[number]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.4);

      const yesCheckboxWidth = doc.getTextWidth('SÍ') + 3.2 + 2.5;
      const noCheckboxWidth = doc.getTextWidth('NO') + 3.2 + 2.5;
      const totalCheckboxWidth = yesCheckboxWidth + 4 + noCheckboxWidth;
      const textWidth = contentWidth - totalCheckboxWidth - 8;

      const wrapped = doc.splitTextToSize(question.description, textWidth);
      return { wrapped, height: wrapped.length * 4.6 + 3.5, yesCheckboxWidth, totalCheckboxWidth };
    };

    const renderAntecedentQuestionWithTable = (
      question: (typeof HEALTH_QUESTIONS)[number],
      entries: AntecedentDetail[],
      columns: string[],
      widths: number[],
      rowHeight: number,
    ) => {
      const isYes = data.healthDeclaration.questions[question.id]?.answer === 'SÍ';
      const metrics = measureAntecedentQuestion(question);
      const tableHeaderHeight = 5;
      const tableEntries: AntecedentDetail[] = isYes
        ? entries
        : Array.from({ length: 2 }, () => ({
            field1: 'N/A',
            field2: 'N/A',
            field3: 'N/A',
            field4: 'N/A',
          }));
      const tableHeight = tableEntries.length > 0
        ? tableHeaderHeight + tableEntries.length * rowHeight
        : 0;
      const blockHeight = metrics.height + tableHeight;

      if (currentY + blockHeight + 10 > pageHeight - margin - 15) {
        doc.addPage();
        currentY = margin + 22;
      }

      // Recuadro de la pregunta oficial + checkboxes
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(margin, currentY, contentWidth, metrics.height);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.4);
      doc.setTextColor(51, 65, 85);
      metrics.wrapped.forEach((line: string, index: number) => {
        doc.text(line, margin + 2, currentY + 2.5 + index * 4.6);
      });

      const finalCheckboxY = currentY + metrics.height / 2;
      const checkStartX = margin + contentWidth - metrics.totalCheckboxWidth - 3;
      drawCheckbox('SÍ', isYes, checkStartX, finalCheckboxY);
      drawCheckbox('NO', !isYes, checkStartX + metrics.yesCheckboxWidth + 4, finalCheckboxY);

      if (tableEntries.length > 0) {
        const tableTop = currentY + metrics.height;
        const tableBottom = tableTop + tableHeight;

        // Cabecera de la tabla
        doc.setFillColor(226, 232, 240);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, tableTop, contentWidth, tableHeaderHeight, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(7, 62, 35);
        let headerX = margin;
        columns.forEach((header, index) => {
          doc.text(header, headerX + 1.5, tableTop + 3.4);
          headerX += widths[index];
        });

        // Filas de datos
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(15, 23, 42);
        tableEntries.forEach((entry, rowIndex) => {
          const rowTop = tableTop + tableHeaderHeight + rowIndex * rowHeight;
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.18);
          doc.rect(margin, rowTop, contentWidth, rowHeight);

          const cells = [entry.field1, entry.field2, entry.field3, entry.field4];
          let cellX = margin;
          cells.forEach((cell, colIndex) => {
            const truncated = doc.splitTextToSize(cell || '', widths[colIndex] - 3);
            doc.text(truncated[0] || '', cellX + 1.5, rowTop + 4);
            cellX += widths[colIndex];
          });
        });

        // Separadores verticales entre columnas
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.18);
        let separatorX = margin;
        widths.slice(0, -1).forEach((width) => {
          separatorX += width;
          doc.line(separatorX, tableTop, separatorX, tableBottom);
        });

        // Línea de separación cabecera / primera fila
        doc.line(margin, tableTop + tableHeaderHeight, margin + contentWidth, tableTop + tableHeaderHeight);
      }

      currentY += blockHeight;
    };

    const contractColumns = ['Nro. Contrato', 'Nombre de la Compañía', 'Límite de Cobertura', 'Fecha Vigencia'];
    const refusalColumns = ['Tipo de Seguro', 'Nombre de la Compañía', 'Límite de Cobertura', 'Fecha Rechazo/Anulación'];
    const contractWidths = [37.9, 62, 48, 48];
    const refusalWidths = [31.9, 62, 48, 54];
    const dataRowHeight = 5.6;

    // Encabezado de la caja
    const boxHeaderHeight = 6.5;
    if (currentY + boxHeaderHeight + 66 > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 22;
    }
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.rect(margin, currentY, contentWidth, boxHeaderHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 62, 35);
    doc.text('OTROS CONTRATOS DE SALUD', margin + 3, currentY + 4.6);
    currentY += boxHeaderHeight;

    const q25 = officialDeclarationQuestions.find((item) => item.id === 25);
    const q26 = officialDeclarationQuestions.find((item) => item.id === 26);

    if (q25) {
      renderAntecedentQuestionWithTable(q25, getAntecedentEntries(25), contractColumns, contractWidths, dataRowHeight);
      currentY += 4;
    }

    if (q26) {
      renderAntecedentQuestionWithTable(q26, getAntecedentEntries(26), refusalColumns, refusalWidths, dataRowHeight);
      currentY += 4;
    }

    if (currentY + 26 > contentBottomLimit) {
      startNewPage();
    }

    currentY = drawSectionTitle('Forma de Pago', currentY);
    const payment = data.payment;
    const methodText = `${payment.method}${payment.otherPaymentDetails ? ` (${payment.otherPaymentDetails})` : ''}`;

    drawRow([
      { label: 'Frecuencia de Pago', value: payment.paymentFrequency, x: margin, w: thirdW },
      { label: 'Moneda de Pago', value: payment.currency, x: margin + thirdW, w: thirdW },
      { label: 'Modalidad de Pago', value: methodText, x: margin + thirdW * 2, w: thirdW },
    ]);

    currentY += 3;

    if (currentY + 42 > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 22;
    } else {
      currentY += 6;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 36, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(7, 62, 35);
    doc.text('DECLARACIÓN DEL PROPUESTO AFILIADO TITULAR:', margin + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(51, 65, 85);
    const policyholderName = `${data.policyholder.firstNames} ${data.policyholder.lastNames}`.toUpperCase();
    const policyholderDocument = `${data.policyholder.documentType}-${data.policyholder.documentNumber}`;
    const policyholderDeclarationText = `Yo, ${policyholderName}, titular de la C.I. Nº ${policyholderDocument}, en mi condición de PROPUESTO AFILIADO TITULAR, declaro bajo fe de juramento que he leído cuidadosamente y totalmente, una a una, todas las preguntas y respuestas contenidas en esta solicitud y que ellas son verdaderas, completas y exactas, sin omitir ni falsear hecho alguno que pueda influir en la apreciación del riesgo por parte de PREVIASIS MEDICINA PREPAGADA S.A. Convengo en que esta solicitud constituirá la base del contrato. Asimismo, autorizo expresamente el envío de mensajes de datos, notificaciones electrónicas y la verificación de mi historial médico conforme a la normativa vigente de la República Bolivariana de Venezuela.`;
    const policyholderDeclarationLines = doc.splitTextToSize(policyholderDeclarationText, contentWidth - 6);
    doc.text(policyholderDeclarationLines, margin + 3, currentY + 8.5);

    drawCheckbox('Acepto y ratifico la declaración del Afiliado Titular', data.signatures.acceptsPolicyholderDeclaration, margin + 3, currentY + 32);
    currentY += 38;

    ensureSpace(36);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 32, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(7, 62, 35);
    doc.text('DECLARACIÓN DE ORIGEN DE FONDOS (CONTRATANTE):', margin + 3, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(51, 65, 85);
    const contractorName = (data.contractor.isDifferent
      ? data.contractor.personType === 'Natural'
        ? `${data.contractor.naturalPerson.firstNames} ${data.contractor.naturalPerson.lastNames}`
        : data.contractor.legalEntity.legalName
      : policyholderName).toUpperCase();
    const contractorDocument = data.contractor.isDifferent
      ? data.contractor.personType === 'Natural'
        ? `${data.contractor.naturalPerson.documentType}-${data.contractor.naturalPerson.documentNumber}`
        : `${data.contractor.legalEntity.taxIdType}-${data.contractor.legalEntity.taxId}`
      : policyholderDocument;

    const sourceOfFundsText = `Yo, ${contractorName}, titular de la identificación Nº ${contractorDocument}, en mi condición de CONTRATANTE, doy fe de que el dinero utilizado para el pago de las cuotas del PLAN DE SALUD proviene de una fuente lícita y legítima, no vinculada con actividades ilícitas ni de legitimación de capitales, de conformidad con la Ley Orgánica contra la Delincuencia Organizada y las normas de la Superintendencia de la Actividad Aseguradora.`;
    const sourceOfFundsLines = doc.splitTextToSize(sourceOfFundsText, contentWidth - 6);
    doc.text(sourceOfFundsLines, margin + 3, currentY + 8.5);

    drawCheckbox('Doy fe del origen lícito de los fondos', true, margin + 3, currentY + 28);
    currentY += 34;

    drawRow([
      { label: 'Lugar de Suscripción', value: data.signatures.place || 'Barquisimeto, Venezuela', x: margin, w: halfW },
      { label: 'Fecha de Suscripción', value: formatPdfDate(data.signatures.date || data.header.applicationDate), x: margin + halfW, w: halfW },
    ]);
    currentY += 2.5;

    ensureSpace(76);
    currentY = drawSectionTitle('Firmas y Huellas Dactilares Oficiales', currentY);

    const boxSignW = (contentWidth - 6) / 2;
    const boxSignH = 46;

    doc.setDrawColor(7, 62, 35);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, boxSignW, boxSignH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(7, 62, 35);
    doc.text('PROPUESTO AFILIADO TITULAR', margin + 3, currentY + 4.5);

    if (data.signatures.policyholderSignatureBase64) {
      try {
        doc.addImage(data.signatures.policyholderSignatureBase64, 'PNG', margin + 4, currentY + 7, boxSignW - 28, 24);
      } catch (err) {
        console.error('Error embedding policyholder signature:', err);
      }
    }

    const fpX = margin + boxSignW - 24;
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(fpX, currentY + 6, 20, 26);
    doc.setLineDashPattern([], 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Huella Dactilar', fpX + 3.5, currentY + 20);

    doc.setDrawColor(15, 23, 42);
    doc.line(margin + 4, currentY + 34, fpX - 2, currentY + 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(policyholderName, margin + 4, currentY + 38);
    doc.text(`C.I: ${policyholderDocument}`, margin + 4, currentY + 42);

    const contX = margin + boxSignW + 6;
    doc.setDrawColor(7, 62, 35);
    doc.rect(contX, currentY, boxSignW, boxSignH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(7, 62, 35);
    doc.text('CONTRATANTE / REPRESENTANTE LEGAL', contX + 3, currentY + 4.5);

    const contractorSignature = data.signatures.contractorSignatureBase64 || data.signatures.policyholderSignatureBase64;
    if (contractorSignature) {
      try {
        doc.addImage(contractorSignature, 'PNG', contX + 4, currentY + 7, boxSignW - 28, 24);
      } catch (err) {
        console.error('Error embedding contractor signature:', err);
      }
    }

    const fpContX = contX + boxSignW - 24;
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(fpContX, currentY + 6, 20, 26);
    doc.setLineDashPattern([], 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Huella Dactilar', fpContX + 3.5, currentY + 20);

    doc.setDrawColor(15, 23, 42);
    doc.line(contX + 4, currentY + 34, fpContX - 2, currentY + 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(contractorName, contX + 4, currentY + 38);
    doc.text(`ID: ${contractorDocument}`, contX + 4, currentY + 42);

    currentY += boxSignH + 4;

    currentY = drawSectionTitle('Intermediario de la Actividad Aseguradora', currentY);
    const broker = data.broker;
    drawRow([
      { label: 'Nombre y Apellido del Intermediario', value: broker.fullName, x: margin, w: thirdW * 1.2 },
      { label: 'Nº Credencial Sudeaseg', value: broker.credentialNumber, x: margin + thirdW * 1.2, w: thirdW * 0.8 },
      { label: 'C.I. / R.I.F. / Pasaporte', value: `${broker.documentType}-${broker.identityOrTaxNumber}`, x: margin + thirdW * 2, w: thirdW },
    ]);

    const totalPages = doc.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      doc.setPage(pageNumber);
      drawPageFooter(pageNumber, totalPages);
      if (isDraft) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(34);
        originalSetTextColor(220, 220, 220);
        doc.text('BORRADOR - SIN FIRMA', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: -30,
        });
      }
    }

    return doc;
  }


  static async downloadPdf(
    data: AffiliationFormState,
    filename?: string,
    options: PdfGenerationOptions = {},
  ): Promise<void> {
    const doc = await this.generateApplicationPdf(data, options);
    const name = filename || `Solicitud_Afiliacion_Previasis_${data.policyholder.documentNumber || 'Doc'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(name);
  }


  static async getPdfBlobUrl(
    data: AffiliationFormState,
    options: PdfGenerationOptions = {},
  ): Promise<string> {
    const doc = await this.generateApplicationPdf(data, options);
    return doc.output('bloburl').toString();
  }

  private static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  }
}

export default PdfGeneratorService;
