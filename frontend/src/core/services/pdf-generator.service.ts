import { jsPDF } from 'jspdf';
import { AffiliationFormState } from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';
import { formatAffiliateDocumentForPdf } from '@/core/utils/minor-document.utils';


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

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const logo = await this.loadImage('/images/logo-previasis-horizontal.png').catch(() => null);

    const drawHeaderAndFooter = (pageNum: number, totalPages: number) => {
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
      doc.setFillColor(7, 62, 35);
      doc.rect(margin, y, contentWidth, 5.2, 'F');

      doc.setDrawColor(0, 139, 71);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, contentWidth, 5.2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
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

    const drawCell = (label: string, value: string, x: number, y: number, w: number, h: number = 8.5) => {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(x, y, w, h);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(7, 62, 35);
      doc.text(label.toUpperCase(), x + 1.5, y + 2.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      const truncated = doc.splitTextToSize(value || '-', w - 3);
      doc.text(truncated[0] || '-', x + 1.5, y + 6.5);
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

    drawHeaderAndFooter(1, 3);
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

    doc.text(`Fecha: ${data.header.applicationDate || '-'}`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });
    currentY += 8.5;

    currentY = drawSectionTitle('1. Datos del Propuesto Afiliado Titular', currentY);
    const policyholderData = data.policyholder;
    const halfW = contentWidth / 2;
    const thirdW = contentWidth / 3;
    const fourthW = contentWidth / 4;

    const rowHeight = 8.5;

    const w1 = contentWidth * 0.18;
    const w2 = contentWidth * 0.18;
    const w3 = contentWidth * 0.13;
    const w4 = contentWidth * 0.13;
    const w5 = contentWidth * 0.13;
    const w6 = contentWidth * 0.13;
    const w7 = contentWidth * 0.12;

    drawCell('Nombres', policyholderData.firstNames, margin, currentY, w1);
    drawCell('Apellidos', policyholderData.lastNames, margin + w1, currentY, w2);
    drawCell('C.I. / Pasaporte', `${policyholderData.documentType}-${policyholderData.documentNumber}`, margin + w1 + w2, currentY, w3);
    drawCell('R.I.F.', `${policyholderData.taxIdType}-${policyholderData.taxId}`, margin + w1 + w2 + w3, currentY, w4);
    drawCell('Nacionalidad', policyholderData.nationality, margin + w1 + w2 + w3 + w4, currentY, w5);
    drawCell('Edo. Civil', policyholderData.maritalStatus, margin + w1 + w2 + w3 + w4 + w5, currentY, w6);
    drawSexCell(policyholderData.sex, margin + w1 + w2 + w3 + w4 + w5 + w6, currentY, w7, rowHeight);
    currentY += rowHeight;

    const secondRowWidth = contentWidth / 4;
    drawCell('Lugar de Nacimiento', policyholderData.birthPlace, margin, currentY, secondRowWidth);
    drawCell('Fecha Nacimiento', policyholderData.birthDate, margin + secondRowWidth, currentY, secondRowWidth);
    drawCell('Profesión', policyholderData.profession, margin + secondRowWidth * 2, currentY, secondRowWidth);
    drawCell('Ocupación', policyholderData.occupation, margin + secondRowWidth * 3, currentY, secondRowWidth);
    currentY += rowHeight;

    const incomeWidth = contentWidth * 0.25;
    const politicallyExposedWidth = contentWidth * 0.40;
    const classificationWidth = contentWidth - incomeWidth - politicallyExposedWidth;
    drawCell('Ingreso Anual / Mensual', policyholderData.annualIncomeBs, margin, currentY, incomeWidth);
    drawCell(
      'Persona Expuesta Políticamente (PEP)',
      `${policyholderData.politicallyExposed}${policyholderData.politicallyExposed === 'SÍ' && policyholderData.politicallyExposedDescription ? ` (${policyholderData.politicallyExposedDescription})` : ''}`,
      margin + incomeWidth,
      currentY,
      politicallyExposedWidth
    );
    drawCell('Clasificación Actividad', policyholderData.activityClassification, margin + incomeWidth + politicallyExposedWidth, currentY, classificationWidth);
    currentY += rowHeight;

    if (policyholderData.activityClassification === 'Dependiente' && policyholderData.company) {
      drawCell('Empresa donde labora', policyholderData.company, margin, currentY, contentWidth);
      currentY += rowHeight;
    }

    drawCell('Estado', policyholderData.residenceState || '-', margin, currentY, halfW);
    drawCell('Ciudad', policyholderData.residenceCity || '-', margin + halfW, currentY, halfW);
    currentY += rowHeight;

    drawCell('Dirección de Residencia / Habitación', policyholderData.homeAddress, margin, currentY, contentWidth * 0.5);
    drawCell('Dirección de Oficina / Trabajo', policyholderData.officeAddress, margin + contentWidth * 0.5, currentY, contentWidth * 0.5);
    currentY += rowHeight;

    const billingWidth = contentWidth * 0.20;
    const homePhoneWidth = contentWidth * 0.20;
    const mobilePhoneWidth = contentWidth * 0.20;
    const emailWidth = contentWidth - billingWidth - homePhoneWidth - mobilePhoneWidth;
    drawCell('Dirección de Cobro', policyholderData.billingAddress, margin, currentY, billingWidth);
    drawCell('Teléfono Habitación', policyholderData.homePhone, margin + billingWidth, currentY, homePhoneWidth);
    drawCell('Teléfono Móvil', policyholderData.mobilePhone, margin + billingWidth + homePhoneWidth, currentY, mobilePhoneWidth);
    drawCell('Correo Electrónico', policyholderData.email, margin + billingWidth + homePhoneWidth + mobilePhoneWidth, currentY, emailWidth);
    currentY += rowHeight + 2;


    const contractorData = data.contractor;
    currentY = drawSectionTitle('2. Datos del Contratante', currentY);

    if (!contractorData.isDifferent) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(margin, currentY, contentWidth, 7.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(0, 139, 71);
      doc.text(
        'EL CONTRATANTE ES EL MISMO PROPUESTO AFILIADO TITULAR (DATOS IDENTIFICADOS EN LA SECCIÓN 1).',
        margin + 4,
        currentY + 4.8,
      );
      currentY += 9.5;
    }

    if (contractorData.isDifferent) {
      const contractorPerson = contractorData.naturalPerson;
      const contractorRowHeight = 8.5;

      drawCell('Nombres y Apellidos Contratante', `${contractorPerson.firstNames} ${contractorPerson.lastNames}`, margin, currentY, halfW);
      drawCell('C.I. / Pasaporte', `${contractorPerson.documentType}-${contractorPerson.documentNumber}`, margin + halfW, currentY, fourthW);
      drawCell('R.I.F.', `${contractorPerson.taxIdType}-${contractorPerson.taxId}`, margin + halfW + fourthW, currentY, fourthW);
      currentY += contractorRowHeight;

      const contractorNationalityWidth = contentWidth * 0.17;
      const contractorMaritalStatusWidth = contentWidth * 0.17;
      const contractorSexWidth = contentWidth * 0.12;
      const contractorBirthDateWidth = contentWidth * 0.18;
      const contractorBirthPlaceWidth = contentWidth - contractorNationalityWidth - contractorMaritalStatusWidth - contractorSexWidth - contractorBirthDateWidth;
      drawCell('Nacionalidad', contractorPerson.nationality, margin, currentY, contractorNationalityWidth);
      drawCell('Estado Civil', contractorPerson.maritalStatus, margin + contractorNationalityWidth, currentY, contractorMaritalStatusWidth);
      drawCell('Sexo', contractorPerson.sex, margin + contractorNationalityWidth + contractorMaritalStatusWidth, currentY, contractorSexWidth);
      drawCell('Fecha de Nacimiento', contractorPerson.birthDate, margin + contractorNationalityWidth + contractorMaritalStatusWidth + contractorSexWidth, currentY, contractorBirthDateWidth);
      drawCell('Lugar de Nacimiento', contractorPerson.birthPlace, margin + contractorNationalityWidth + contractorMaritalStatusWidth + contractorSexWidth + contractorBirthDateWidth, currentY, contractorBirthPlaceWidth);
      currentY += contractorRowHeight;

      const contractorProfessionWidth = contentWidth * 0.25;
      const contractorOccupationWidth = contentWidth * 0.25;
      const contractorIncomeWidth = contentWidth * 0.20;
      const contractorPoliticallyExposedWidth = contentWidth * 0.15;
      const contractorActivityWidth = contentWidth - contractorProfessionWidth - contractorOccupationWidth - contractorIncomeWidth - contractorPoliticallyExposedWidth;
      drawCell('Profesión', contractorPerson.profession, margin, currentY, contractorProfessionWidth);
      drawCell('Ocupación', contractorPerson.occupation, margin + contractorProfessionWidth, currentY, contractorOccupationWidth);
      drawCell('Ingreso Anual (Bs.)', contractorPerson.annualIncomeBs, margin + contractorProfessionWidth + contractorOccupationWidth, currentY, contractorIncomeWidth);
      drawCell('PEP', `${contractorPerson.politicallyExposed}${contractorPerson.politicallyExposed === 'SÍ' && contractorPerson.politicallyExposedDescription ? `: ${contractorPerson.politicallyExposedDescription}` : ''}`, margin + contractorProfessionWidth + contractorOccupationWidth + contractorIncomeWidth, currentY, contractorPoliticallyExposedWidth);
      drawCell('Actividad', contractorPerson.activityClassification, margin + contractorProfessionWidth + contractorOccupationWidth + contractorIncomeWidth + contractorPoliticallyExposedWidth, currentY, contractorActivityWidth);
      currentY += contractorRowHeight;

      if (contractorPerson.activityClassification === 'Dependiente' && contractorPerson.company) {
        drawCell('Empresa donde labora', contractorPerson.company, margin, currentY, halfW);
        drawCell('Dirección de Habitación', contractorPerson.homeAddress, margin + halfW, currentY, fourthW);
        drawCell('Dirección de Oficina', contractorPerson.officeAddress, margin + halfW + fourthW, currentY, fourthW);
        currentY += contractorRowHeight;

        drawCell('Dirección de Cobro', contractorPerson.billingAddress, margin, currentY, halfW);
        drawCell('Teléfono Habitación', contractorPerson.homePhone, margin + halfW, currentY, fourthW);
        drawCell('Teléfono Móvil', contractorPerson.mobilePhone, margin + halfW + fourthW, currentY, fourthW);
        currentY += contractorRowHeight;

        drawCell('Correo Electrónico', contractorPerson.email, margin, currentY, contentWidth);
        currentY += contractorRowHeight + 2;
      } else {
        drawCell('Dirección de Habitación', contractorPerson.homeAddress, margin, currentY, halfW);
        drawCell('Dirección de Oficina', contractorPerson.officeAddress, margin + halfW, currentY, fourthW);
        drawCell('Dirección de Cobro', contractorPerson.billingAddress, margin + halfW + fourthW, currentY, fourthW);
        currentY += contractorRowHeight;

        drawCell('Teléfono Local', contractorPerson.homePhone, margin, currentY, contentWidth * 0.20);
        drawCell('Teléfono Móvil', contractorPerson.mobilePhone, margin + contentWidth * 0.20, currentY, contentWidth * 0.20);
        drawCell('Correo Electrónico', contractorPerson.email, margin + contentWidth * 0.40, currentY, contentWidth * 0.60);
        currentY += contractorRowHeight + 2;
      }
    }
    currentY = drawSectionTitle('3. Personas a Afiliar y Plan Solicitado', currentY);

    const colWidths = [8, 50, 22, 20, 20, 12, 16, 25, 22.9];
    const headers = ['Nº', 'Nombre y Apellido', 'C.I. / R.I.F.', 'F. Nac.', 'Parentesco', 'Sexo', 'P(kg)/E(cm)', 'Plan Solicitado', 'Límite Cobertura'];

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
      doc.text(af.birthDate || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[3];
      doc.text(af.relationship || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[4];
      doc.text(af.sex || '-', rowX + 3.5, currentY + 4.5);
      rowX += colWidths[5];
      doc.text(`${af.weightKg || '-'}k/${af.heightCm || '-'}c`, rowX + 1.5, currentY + 4.5);
      rowX += colWidths[6];
      doc.text(af.requestedPlan || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[7];
      doc.text(af.coverageLimit || '-', rowX + 1.5, currentY + 4.5);

      currentY += 6.5;
    });

    doc.addPage();
    const startHealthY = margin + 22;
    currentY = startHealthY;

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

    HEALTH_QUESTIONS.forEach((q) => {
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
        const extraText = `Esp: ${extra.substring(0, 60)}${extra.length > 60 ? '…' : ''}`;
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


    const conditions = data.healthDeclaration.medicalConditionDetails || [];

    if (conditions.length > 0) {
      const rowHeight = 6.5;
      const headerHeight = 11;
      const bottomLimit = pageHeight - margin - 15;

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

      if (currentY + headerHeight + rowHeight > bottomLimit) {
        doc.addPage();
        currentY = margin + 22;
      } else {
        currentY += 3;
      }
      let conditionColumnWidths = renderConditionsHeader();
      conditions.forEach((af) => {

        const requiredInitialSpace = headerHeight + (rowHeight * 2);

        if (currentY + requiredInitialSpace > bottomLimit) {
          doc.addPage();
          currentY = margin + 22;
        }


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

        doc.text(af.diagnosisDate || '-', rowX + 1.5, currentY + 4.2);
        rowX += conditionColumnWidths[2];

        doc.text(
          doc.splitTextToSize(af.treatment || '-', conditionColumnWidths[3] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );
        rowX += conditionColumnWidths[3];

        doc.text(af.lastCheckupDate || '-', rowX + 1.5, currentY + 4.2);
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

      if (currentY + estimatedHeight > pageHeight - margin - 18) {
        doc.addPage();
        currentY = margin + 22;
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

        doc.text(doc.splitTextToSize(dep.frequency || '-', sportColumnWidths[2] - 2)[0] || '-', rowX + 1.5, currentY + 4);
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
      if (currentY + estimatedHeight > pageHeight - margin - 18) {
        doc.addPage();
        currentY = margin + 22;
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
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, rowHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(15, 23, 42);

        let rowX = margin;
        doc.text(`#${detail.affiliateCode}`, rowX + 2, currentY + 4);
        rowX += detailColWidths[0];
        doc.text(doc.splitTextToSize(detail.field1 || '-', detailColWidths[1] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += detailColWidths[1];
        doc.text(doc.splitTextToSize(detail.field2 || '-', detailColWidths[2] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        currentY += rowHeight;
      });

      currentY += 2;
    };

    HEALTH_QUESTIONS
      .filter((question) => question.beneficiaryDetail && question.id !== 17)
      .forEach(renderBeneficiaryDetails);

    if (currentY + 26 > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 22;
    }

    currentY = drawSectionTitle('5. Forma de Pago', currentY);
    const payment = data.payment;

    const cellHeight = 8.5;
    const methodText = `${payment.method}${payment.otherPaymentDetails ? ` (${payment.otherPaymentDetails})` : ''}`;

    drawCell('Frecuencia de Pago', payment.paymentFrequency, margin, currentY, thirdW, cellHeight);
    drawCell('Moneda de Pago', payment.currency, margin + thirdW, currentY, thirdW, cellHeight);
    drawCell('Modalidad de Pago', methodText, margin + thirdW * 2, currentY, thirdW, cellHeight);

    currentY += cellHeight + 3;
    if (currentY + 90 > pageHeight - margin - 18) {
      doc.addPage();
      currentY = margin + 22;
    }

    currentY = drawSectionTitle('6. Declaraciones y Autorizaciones Oficiales', currentY);

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

    drawCell('Lugar de Suscripción', data.signatures.place || 'Barquisimeto, Venezuela', margin, currentY, halfW);
    drawCell('Fecha de Suscripción', data.signatures.date || data.header.applicationDate || '-', margin + halfW, currentY, halfW);
    currentY += 11;

    currentY = drawSectionTitle('7. Firmas y Huellas Dactilares Oficiales', currentY);

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

    currentY = drawSectionTitle('8. Intermediario de la Actividad Aseguradora', currentY);
    const broker = data.broker;
    drawCell('Nombre y Apellido del Intermediario', broker.fullName, margin, currentY, thirdW * 1.2);
    drawCell('Nº Credencial Sudeaseg', broker.credentialNumber, margin + thirdW * 1.2, currentY, thirdW * 0.8);
    drawCell('C.I. / R.I.F. / Pasaporte', `${broker.documentType}-${broker.identityOrTaxNumber}`, margin + thirdW * 2, currentY, thirdW);

    if (isDraft) {
      const totalPages = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(34);
        doc.setTextColor(220, 220, 220);
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
