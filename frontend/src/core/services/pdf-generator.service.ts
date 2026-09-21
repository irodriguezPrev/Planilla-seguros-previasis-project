import { jsPDF } from 'jspdf';
import { SolicitudAfiliacionFormState } from '@/core/interfaces/affiliation.interfaces';
import { HEALTH_QUESTIONS } from '@/core/config/health-questions.config';


export type PdfGenerationMode = 'draft' | 'final';

export interface PdfGenerationOptions {
  mode?: PdfGenerationMode;
}

export class PdfGeneratorService {
  /**
   * Genera el documento oficial Sudeaseg en PDF de alta fidelidad
   * Conforme a la Providencia Administrativa Nº SAA-09-1585 del 04/03/2026
   */
  static async generateSolicitudPdf(
    sourceData: SolicitudAfiliacionFormState,
    options: PdfGenerationOptions = {},
  ): Promise<jsPDF> {
    const data = options.mode === 'draft'
      ? {
          ...sourceData,
          firmas: {
            ...sourceData.firmas,
            firmaTitularBase64: null,
            firmaContratanteBase64: null,
            aceptaDeclaracionTitular: false,
            aceptaOrigenFondosContratante: false,
          },
        }
      : sourceData;
    const isDraft = options.mode === 'draft';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter', // 215.9 x 279.4 mm
    });

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 195.9 mm
    const logo = await this.cargarImagen('/images/logo-previasis-horizontal.png').catch(() => null);

    // Helper: Dibuja el encabezado oficial y el pie de página legal obligatorio
    const drawHeaderAndFooter = (pageNum: number, totalPages: number) => {
      // Header Box con borde doble
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 139, 71); // Verde Previasís
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, contentWidth, 20, 'FD');

      // Línea interior sutil
      doc.setDrawColor(7, 62, 35);
      doc.setLineWidth(0.18);
      doc.rect(margin + 0.8, margin + 0.8, contentWidth - 1.6, 18.4);

      // Marca corporativa: proporción original, sin espacio transparente sobrante.
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

      // Título del Formulario (Derecha)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(11, 43, 64);
      doc.text('SOLICITUD DE AFILIACIÓN', pageWidth - margin - 4, margin + 7, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Nº Solicitud: ${data.header.numSolicitud || 'EMISIÓN DIRECTA'}`, pageWidth - margin - 4, margin + 12, { align: 'right' });
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 4, margin + 16.5, { align: 'right' });

      // PIE DE PÁGINA OBLIGATORIO SUDEASEG EN TODAS LAS PÁGINAS
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
      doc.setFillColor(7, 62, 35); // Verde Bosque
      doc.rect(margin, y, contentWidth, 5.2, 'F');

      // Borde decorativo
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
      doc.setLineWidth(0.18); // 0.5pt
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

    const drawSexoCell = (sexo: string, x: number, y: number, w: number, h: number) => {
      // Borde de la celda
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.rect(x, y, w, h);

      // Etiqueta "SEXO"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(7, 62, 35);
      doc.text('SEXO', x + 1.3, y + 2.4);

      // Círculo y letra (M o F)
      const circleX = x + w / 2;
      const circleY = y + h / 2 + 1;
      const radius = 3.5;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.circle(circleX, circleY, radius, 'S');

      if (sexo && sexo.toUpperCase() === 'M') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('M', circleX - 1.5, circleY + 2.5);
      } else if (sexo && sexo.toUpperCase() === 'F') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('F', circleX - 1.5, circleY + 2.5);
      }
    };

    // ================= PÁGINA 1 =================
    drawHeaderAndFooter(1, 3);
    let currentY = margin + 22;

    // Control bar (Tipo Operación, Contrato, Fecha)
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.18);
    doc.rect(margin, currentY, contentWidth, 7, 'D');

    let cbX = margin + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 62, 35);
    doc.text('Operación:', cbX, currentY + 4.5);
    cbX += 16;
    cbX = drawCheckbox('Emisión', data.header.tipoOperacion === 'Emisión', cbX, currentY + 4.5);
    cbX = drawCheckbox('Inclusión', data.header.tipoOperacion === 'Inclusión', cbX, currentY + 4.5);

    cbX += 8;
    doc.text('Contrato:', cbX, currentY + 4.5);
    cbX += 14;
    cbX = drawCheckbox('Individual', data.header.tipoContrato === 'Individual', cbX, currentY + 4.5);
    cbX = drawCheckbox('Colectivo', data.header.tipoContrato === 'Colectivo', cbX, currentY + 4.5);

    doc.text(`Fecha: ${data.header.fechaSolicitud || '-'}`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });
    currentY += 8.5;

    // SECCIÓN 1: DATOS DEL PROPUESTO AFILIADO TITULAR
    currentY = drawSectionTitle('1. Datos del Propuesto Afiliado Titular', currentY);
    const tit = data.titular;
    const halfW = contentWidth / 2;
    const thirdW = contentWidth / 3;
    const fourthW = contentWidth / 4;

    const rowHeight = 8.5;

    // ----- Fila 1: todos los campos en una sola fila -----
    const w1 = contentWidth * 0.18;  // Nombres
    const w2 = contentWidth * 0.18;  // Apellidos
    const w3 = contentWidth * 0.13;  // C.I.
    const w4 = contentWidth * 0.13;  // R.I.F.
    const w5 = contentWidth * 0.13;  // Nacionalidad
    const w6 = contentWidth * 0.13;  // Edo. Civil
    const w7 = contentWidth * 0.12;  // Sexo (círculo)

    drawCell('Nombres', tit.nombres, margin, currentY, w1);
    drawCell('Apellidos', tit.apellidos, margin + w1, currentY, w2);
    drawCell('C.I. / Pasaporte', `${tit.tipoDoc}-${tit.numDoc}`, margin + w1 + w2, currentY, w3);
    drawCell('R.I.F.', `${tit.tipoRif}-${tit.numRif}`, margin + w1 + w2 + w3, currentY, w4);
    drawCell('Nacionalidad', tit.nacionalidad, margin + w1 + w2 + w3 + w4, currentY, w5);
    drawCell('Edo. Civil', tit.estadoCivil, margin + w1 + w2 + w3 + w4 + w5, currentY, w6);
    drawSexoCell(tit.sexo, margin + w1 + w2 + w3 + w4 + w5 + w6, currentY, w7, rowHeight);
    currentY += rowHeight;

    // ----- Fila 2: Lugar, Fecha, Profesión, Ocupación -----
    const wFila2 = contentWidth / 4;
    drawCell('Lugar de Nacimiento', tit.lugarNacimiento, margin, currentY, wFila2);
    drawCell('Fecha Nacimiento', tit.fechaNacimiento, margin + wFila2, currentY, wFila2);
    drawCell('Profesión', tit.profesion, margin + wFila2 * 2, currentY, wFila2);
    drawCell('Ocupación', tit.ocupacion, margin + wFila2 * 3, currentY, wFila2);
    currentY += rowHeight;

    // ----- Fila 3: Ingreso, PEP, Clasificación -----
    const wIngreso = contentWidth * 0.25;
    const wPep = contentWidth * 0.40;
    const wClasif = contentWidth - wIngreso - wPep;
    drawCell('Ingreso Anual / Mensual', tit.ingresoAnualBs, margin, currentY, wIngreso);
    drawCell(
      'Persona Expuesta Políticamente (PEP)',
      `${tit.pep}${tit.pep === 'SÍ' && tit.pepDescripcion ? ` (${tit.pepDescripcion})` : ''}`,
      margin + wIngreso,
      currentY,
      wPep
    );
    drawCell('Clasificación Actividad', tit.clasificacionActividad, margin + wIngreso + wPep, currentY, wClasif);
    currentY += rowHeight;

    if (tit.clasificacionActividad === 'Dependiente' && tit.empresa) {
      drawCell('Empresa donde labora', tit.empresa, margin, currentY, contentWidth);
      currentY += rowHeight;
    }

    // ----- Fila 4: Ubicación de residencia -----
    drawCell('Estado', tit.estadoResidencia || '-', margin, currentY, halfW);
    drawCell('Ciudad', tit.ciudadResidencia || '-', margin + halfW, currentY, halfW);
    currentY += rowHeight;

    // ----- Fila 5: Dirección de Residencia y Oficina -----
    drawCell('Dirección de Residencia / Habitación', tit.direccionHabitacion, margin, currentY, contentWidth * 0.5);
    drawCell('Dirección de Oficina / Trabajo', tit.direccionOficina, margin + contentWidth * 0.5, currentY, contentWidth * 0.5);
    currentY += rowHeight;

    // ----- Fila 6: Dirección Cobro, Teléfonos, Correo -----
    const wCobro = contentWidth * 0.20;
    const wTelHab = contentWidth * 0.20;
    const wTelMov = contentWidth * 0.20;
    const wEmail = contentWidth - wCobro - wTelHab - wTelMov; // 40%
    drawCell('Dirección de Cobro', tit.direccionCobro, margin, currentY, wCobro);
    drawCell('Teléfono Habitación', tit.telefonoHabitacion, margin + wCobro, currentY, wTelHab);
    drawCell('Teléfono Móvil', tit.telefonoMovil, margin + wCobro + wTelHab, currentY, wTelMov);
    drawCell('Correo Electrónico', tit.email, margin + wCobro + wTelHab + wTelMov, currentY, wEmail);
    currentY += rowHeight + 2; // pequeño margen extra


    // SECCIÓN 2: DATOS DEL CONTRATANTE
    const cont = data.contratante;
    currentY = drawSectionTitle('2. Datos del Contratante', currentY);

    if (!cont.esDiferente) {
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

    if (cont.esDiferente) {
      const cnat = cont.personaNatural;
      const contratistaRowHeight = 8.5;

      drawCell('Nombres y Apellidos Contratante', `${cnat.nombres} ${cnat.apellidos}`, margin, currentY, halfW);
      drawCell('C.I. / Pasaporte', `${cnat.tipoDoc}-${cnat.numDoc}`, margin + halfW, currentY, fourthW);
      drawCell('R.I.F.', `${cnat.tipoRif}-${cnat.numRif}`, margin + halfW + fourthW, currentY, fourthW);
      currentY += contratistaRowHeight;

      const contratistaNationalityW = contentWidth * 0.17;
      const contratistaCivilStatusW = contentWidth * 0.17;
      const contratistaSexW = contentWidth * 0.12;
      const contratistaBirthDateW = contentWidth * 0.18;
      const contratistaBirthPlaceW = contentWidth - contratistaNationalityW - contratistaCivilStatusW - contratistaSexW - contratistaBirthDateW;
      drawCell('Nacionalidad', cnat.nacionalidad, margin, currentY, contratistaNationalityW);
      drawCell('Estado Civil', cnat.estadoCivil, margin + contratistaNationalityW, currentY, contratistaCivilStatusW);
      drawCell('Sexo', cnat.sexo, margin + contratistaNationalityW + contratistaCivilStatusW, currentY, contratistaSexW);
      drawCell('Fecha de Nacimiento', cnat.fechaNacimiento, margin + contratistaNationalityW + contratistaCivilStatusW + contratistaSexW, currentY, contratistaBirthDateW);
      drawCell('Lugar de Nacimiento', cnat.lugarNacimiento, margin + contratistaNationalityW + contratistaCivilStatusW + contratistaSexW + contratistaBirthDateW, currentY, contratistaBirthPlaceW);
      currentY += contratistaRowHeight;

      const contratistaProfessionW = contentWidth * 0.25;
      const contratistaOccupationW = contentWidth * 0.25;
      const contratistaIncomeW = contentWidth * 0.20;
      const contratistaPepW = contentWidth * 0.15;
      const contratistaActivityW = contentWidth - contratistaProfessionW - contratistaOccupationW - contratistaIncomeW - contratistaPepW;
      drawCell('Profesión', cnat.profesion, margin, currentY, contratistaProfessionW);
      drawCell('Ocupación', cnat.ocupacion, margin + contratistaProfessionW, currentY, contratistaOccupationW);
      drawCell('Ingreso Anual (Bs.)', cnat.ingresoAnualBs, margin + contratistaProfessionW + contratistaOccupationW, currentY, contratistaIncomeW);
      drawCell('PEP', `${cnat.pep}${cnat.pep === 'SÍ' && cnat.pepDescripcion ? `: ${cnat.pepDescripcion}` : ''}`, margin + contratistaProfessionW + contratistaOccupationW + contratistaIncomeW, currentY, contratistaPepW);
      drawCell('Actividad', cnat.clasificacionActividad, margin + contratistaProfessionW + contratistaOccupationW + contratistaIncomeW + contratistaPepW, currentY, contratistaActivityW);
      currentY += contratistaRowHeight;

      if (cnat.clasificacionActividad === 'Dependiente' && cnat.empresa) {
        drawCell('Empresa donde labora', cnat.empresa, margin, currentY, halfW);
        drawCell('Dirección de Habitación', cnat.direccionHabitacion, margin + halfW, currentY, fourthW);
        drawCell('Dirección de Oficina', cnat.direccionOficina, margin + halfW + fourthW, currentY, fourthW);
        currentY += contratistaRowHeight;

        drawCell('Dirección de Cobro', cnat.direccionCobro, margin, currentY, halfW);
        drawCell('Teléfono Habitación', cnat.telefonoHabitacion, margin + halfW, currentY, fourthW);
        drawCell('Teléfono Móvil', cnat.telefonoMovil, margin + halfW + fourthW, currentY, fourthW);
        currentY += contratistaRowHeight;

        drawCell('Correo Electrónico', cnat.email, margin, currentY, contentWidth);
        currentY += contratistaRowHeight + 2;
      } else {
        drawCell('Dirección de Habitación', cnat.direccionHabitacion, margin, currentY, halfW);
        drawCell('Dirección de Oficina', cnat.direccionOficina, margin + halfW, currentY, fourthW);
        drawCell('Dirección de Cobro', cnat.direccionCobro, margin + halfW + fourthW, currentY, fourthW);
        currentY += contratistaRowHeight;

        drawCell('Teléfono Local', cnat.telefonoHabitacion, margin, currentY, contentWidth * 0.20);
        drawCell('Teléfono Móvil', cnat.telefonoMovil, margin + contentWidth * 0.20, currentY, contentWidth * 0.20);
        drawCell('Correo Electrónico', cnat.email, margin + contentWidth * 0.40, currentY, contentWidth * 0.60);
        currentY += contratistaRowHeight + 2;
      }
    }
    // SECCIÓN 3: PERSONAS A AFILIAR Y PLAN SOLICITADO
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

    data.afiliados.slice(0, 6).forEach((af, idx) => {
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, currentY, contentWidth, 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);

      let rowX = margin;
      doc.text(String(af.codigoAfiliado || idx + 1), rowX + 2.5, currentY + 4.5);
      rowX += colWidths[0];
      doc.text(doc.splitTextToSize(af.nombreCompleto || '-', colWidths[1] - 2)[0] || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[1];
      doc.text(`${af.tipoDoc}-${af.numDoc}`, rowX + 1.5, currentY + 4.5);
      rowX += colWidths[2];
      doc.text(af.fechaNacimiento || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[3];
      doc.text(af.parentesco || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[4];
      doc.text(af.sexo || '-', rowX + 3.5, currentY + 4.5);
      rowX += colWidths[5];
      doc.text(`${af.pesoKg || '-'}k/${af.estaturaCm || '-'}c`, rowX + 1.5, currentY + 4.5);
      rowX += colWidths[6];
      doc.text(af.planSolicitado || '-', rowX + 1.5, currentY + 4.5);
      rowX += colWidths[7];
      doc.text(af.limiteCobertura || '-', rowX + 1.5, currentY + 4.5);

      currentY += 6.5;
    });

    // ================= PÁGINA 2 =================
    doc.addPage();
    const startHealthY = margin + 22; // debajo del encabezado
    currentY = startHealthY;

    // ---- ENCABEZADO DE LA DECLARACIÓN DE SALUD ----
    const colCodeW = 22; // ancho de la columna de código
    const colHealthW = pageWidth - margin * 2;
    const colQuestionW = colHealthW - colCodeW; // ancho disponible para la pregunta

    // Título largo (dos líneas)
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, currentY, colHealthW, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, colHealthW, 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.3);
    doc.setTextColor(7, 62, 35);
    const tituloSalud = 'DECLARACIÓN DE SALUD : Usted o algún dependiente, ha(n) padecido o padece(n), o como consecuencia de algún accidente ha tenido alguna de las siguientes dolencias o enfermedades que se indican a continuación: Marque con una "X" la casilla que corresponda y en caso afirmativo subraye la enfermedad o dolencia que padezca o haya padecido e indique el código o (los) número(s) correspondiente(s) al (los) Afiliado(s)';
    const lineasTitulo = doc.splitTextToSize(tituloSalud, colQuestionW - 4);
    doc.text(lineasTitulo, margin + 2, currentY + 3);
    // Etiqueta "Código del Afiliado" en la columna derecha
    doc.text('Código del Afiliado', margin + colQuestionW + 2, currentY + 3);
    currentY += 8;

    // ---- PREGUNTAS DE SALUD (con altura dinámica) ----
    const lineHeight = 4.8; // altura por línea de texto

    HEALTH_QUESTIONS.forEach((q) => {
      const resp = data.salud.preguntas[q.id]?.respuesta || 'NO';
      // Extra detalles si la respuesta es SÍ
      const extra = data.salud.preguntas[q.id]?.detallesExtra;
      const antecedente = data.salud.preguntas[q.id]?.detalleAntecedente;
      const codigosAfiliados = data.salud.preguntas[q.id]?.codigosAfiliados || [];
      const isYes = resp === 'SÍ';

      // 1. Construir el texto completo de la pregunta: título en negrita + ": " + descripción
      const titulo = `${q.id}. ${q.title}`;
      const descripcion = q.description || '';

      const textoCompleto = titulo + ': ' + descripcion;

      // 2. Calcular el ancho disponible para el texto (restar espacio para checkboxes y margen)
      //    Los checkboxes ocupan: "SÍ" + cuadro + espacio + "NO" + cuadro + un margen
      const anchoCheckSI = doc.getTextWidth('SÍ') + 3.2 + 2.5; // texto + cuadro + separación
      const anchoCheckNO = doc.getTextWidth('NO') + 3.2 + 2.5;
      const espacioEntreChecks = 4;
      const anchoTotalCheck = anchoCheckSI + espacioEntreChecks + anchoCheckNO;
      const margenCheck = 3; // separación adicional del borde derecho
      const anchoTexto = colQuestionW - anchoTotalCheck - margenCheck - 4; // 4 de margen izquierdo

      // 3. Dividir el texto en líneas según el ancho disponible
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.0);
      const lineas = doc.splitTextToSize(textoCompleto, anchoTexto);
      const antecedentLines = isYes && q.antecedentFields
        ? [
            `${q.antecedentFields.campo1Label}: ${antecedente?.campo1 || '-'}`,
            `${q.antecedentFields.campo2Label}: ${antecedente?.campo2 || '-'}`,
          ].flatMap((line) => doc.splitTextToSize(line, colQuestionW - 8))
        : [];
      const textoCodigos = codigosAfiliados.length
        ? codigosAfiliados.map((codigo) => `#${codigo}`).join(', ')
        : '-';
      const lineasCodigos = doc.splitTextToSize(textoCodigos, colCodeW - 4);

      // 4. Calcular la altura de la fila (mínimo 7 mm, pero se ajusta al número de líneas)
      const numLineas = lineas.length;
      const extraLineCount = isYes && extra ? 1 : 0;
      const alturaFila = Math.max(
        7,
        (numLineas + extraLineCount + antecedentLines.length) * lineHeight + 3,
        lineasCodigos.length * lineHeight + 3,
      ); // +3 de padding

      // 5. Dibujar el borde de la fila
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, currentY, colHealthW, alturaFila);

      // 6. Dibujar el texto (título en negrita, descripción en normal)
      //    Pero como tenemos el texto completo, podemos usar el mismo estilo para todas las líneas,
      //    o resaltar el título en negrita. Para simplificar, pondré el título en negrita y el resto normal.
      //    Para hacerlo bien, necesitamos dividir el texto en partes: título + ": " + descripción.
      //    Pero para no complicar, dibujamos todo el texto con estilo normal, y el título lo pondremos en negrita
      //    usando la primera parte. Voy a dibujar línea por línea con el formato adecuado.

      // Para cada línea, dibujamos con el estilo adecuado (la primera línea lleva el título en negrita)
      lineas.forEach((linea: any, idx: number) => {
        const yTexto = currentY + 2.5 + idx * lineHeight;
        if (idx === 0) {
          // Primera línea: título en negrita + el resto de la línea (si incluye descripción)
          // Extraemos el título de la línea (asumimos que empieza con "X. Título:")
          const idxDosPuntos = linea.indexOf(':');
          if (idxDosPuntos !== -1) {
            const tituloLinea = linea.substring(0, idxDosPuntos + 1);
            const descLinea = linea.substring(idxDosPuntos + 1);
            // Dibujar título en negrita
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.0);
            doc.setTextColor(isYes ? 0 : 7, isYes ? 139 : 62, isYes ? 71 : 35);
            doc.text(tituloLinea, margin + 2, yTexto);
            // Dibujar descripción en normal (justo después)
            const xDesc = margin + 2 + doc.getTextWidth(tituloLinea);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.0);
            doc.setTextColor(71, 85, 105);
            doc.text(descLinea, xDesc, yTexto);
          } else {
            // Si no hay dos puntos, todo el texto en negrita
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.0);
            doc.setTextColor(isYes ? 0 : 7, isYes ? 139 : 62, isYes ? 71 : 35);
            doc.text(linea, margin + 2, yTexto);
          }
        } else {
          // Líneas siguientes: solo descripción en normal
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.0);
          doc.setTextColor(71, 85, 105);
          doc.text(linea, margin + 2, yTexto);
        }
      });

      // 7. Si hay detalles extra o antecedentes (cuando es SÍ), mostrarlos en líneas adicionales
      let detalleY = currentY + 2.5 + numLineas * lineHeight;
      if (isYes && extra) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(5.2);
        doc.setTextColor(0, 139, 71);
        const extraText = `Esp: ${extra.substring(0, 60)}${extra.length > 60 ? '…' : ''}`;
        doc.text(extraText, margin + 2, detalleY);
        detalleY += lineHeight;
      }

      if (antecedentLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(71, 85, 105);
        antecedentLines.forEach((linea, idx) => {
          doc.text(linea, margin + 2, detalleY + idx * lineHeight);
        });
      }


      // 8. Dibujar los checkboxes SÍ/NO al final de la primera columna
      //    Los centramos verticalmente respecto a la altura total de la fila.
      const yCheckFinal = currentY + alturaFila / 2;

      // Calcular posición x para los checkboxes
      const checkStartX = margin + colQuestionW - anchoTotalCheck - margenCheck;
      drawCheckbox('SÍ', isYes, checkStartX, yCheckFinal);
      drawCheckbox('NO', !isYes, checkStartX + anchoCheckSI + espacioEntreChecks, yCheckFinal);

      // 9. Imprimir los códigos seleccionados en la columna derecha.
      doc.setDrawColor(203, 213, 225);
      doc.line(
        margin + colQuestionW,
        currentY,
        margin + colQuestionW,
        currentY + alturaFila,
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.0);
      doc.setTextColor(15, 23, 42);
      lineasCodigos.forEach((linea: string, idx: number) => {
        doc.text(linea, margin + colQuestionW + 2, currentY + 2.5 + idx * lineHeight);
      });

      // 10. Avanzar currentY
      currentY += alturaFila;
    });

    // ---- DETALLE CLÍNICO DE AFECCIONES ----

    const afecciones = data.salud.afeccionesDetalles || [];

    if (afecciones.length > 0) {
      const rowHeight = 6.5;
      const headerHeight = 11;
      const bottomLimit = pageHeight - margin - 15;

      const renderAfeccionesHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(7, 62, 35);
        doc.text('DETALLE CLÍNICO DE AFECCIONES MÉDICAS DECLARADAS CON "SÍ"', margin + 3, currentY + 3.5);
        currentY += 5;
        const afColW = [16, 42, 28, 42, 28, 39.9];
        const afHeaders = [
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

        let afCurX = margin;
        afHeaders.forEach((h, i) => {
          doc.text(h, afCurX + 1.5, currentY + 3.5);
          afCurX += afColW[i];
        });
        currentY += 5;

        return afColW;
      };

      if (currentY + headerHeight + rowHeight > bottomLimit) {
        doc.addPage();
        currentY = margin + 22;
      } else {
        currentY += 3;
      }
      let afColW = renderAfeccionesHeader();
      afecciones.forEach((af) => {

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

        doc.text(`#${af.codigoAfiliado || 1}`, rowX + 1.5, currentY + 4.2);
        rowX += afColW[0];

        doc.text(
          doc.splitTextToSize(af.padecimiento || '-', afColW[1] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );
        rowX += afColW[1];

        doc.text(af.fechaDiagnostico || '-', rowX + 1.5, currentY + 4.2);
        rowX += afColW[2];

        doc.text(
          doc.splitTextToSize(af.tratamientoPracticado || '-', afColW[3] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );
        rowX += afColW[3];

        doc.text(af.fechaUltimoChequeo || '-', rowX + 1.5, currentY + 4.2);
        rowX += afColW[4];

        doc.text(
          doc.splitTextToSize(af.institucionHospitalaria || '-', afColW[5] - 2)[0] || '-',
          rowX + 1.5,
          currentY + 4.2
        );

        currentY += rowHeight;
      });

      currentY += 2;
    }

    // ---- CONTINUAR CON LA SIGUIENTE SECCIÓN (FORMA DE PAGO, etc.) ----
    // (El código posterior a esta sección debe continuar sin cambios)
    // ---- DETALLE DE PRÁCTICA DEPORTIVA (PREGUNTA N° 17) ----
    const preg17 = data.salud.preguntas[17] || data.salud.preguntas['17']; // TODO put this on dynamic way
    const esDeporteSi = preg17?.respuesta === 'SÍ';
    const detallesDeportivos = data.salud.detallesDeportivos || [];

    if (esDeporteSi && detallesDeportivos.length > 0) {
      // 1. Calcular el alto requerido (Encabezado + Cabecera + Filas)
      const estimatedHeight = 15 + detallesDeportivos.length * 6;

      // 2. Si no hay espacio antes del pie de página, forzar salto a una nueva página
      if (currentY + estimatedHeight > pageHeight - margin - 18) {
        doc.addPage();
        currentY = margin + 22;
      } else {
        currentY += 3;
      }

      // 3. Título de la Sección
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, contentWidth, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(7, 62, 35);
      doc.text('DETALLE DE PRÁCTICA DEPORTIVA DECLARADA (PREGUNTA N° 17)', margin + 3, currentY + 3.5);
      currentY += 5;

      // 4. Cabecera de la Tabla
      const depColW = [25, 65, 65, 40.9];
      const depHeaders = ['Código Afiliado', 'Deporte Practicado', 'Frecuencia / Rutina', 'Nivel de Práctica'];

      doc.setFillColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, 5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(7, 62, 35);

      let depCurX = margin;
      depHeaders.forEach((h, i) => {
        doc.text(h, depCurX + 1.5, currentY + 3.5);
        depCurX += depColW[i];
      });
      currentY += 5;

      // 5. Filas de datos
      detallesDeportivos.forEach((dep) => {
        const rowHeight = 6;
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, currentY, contentWidth, rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(15, 23, 42);

        let rowX = margin;
        doc.text(`#${dep.codigoAfiliado}`, rowX + 2, currentY + 4);
        rowX += depColW[0];

        doc.text(doc.splitTextToSize(dep.deporte || '-', depColW[1] - 2)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += depColW[1];

        doc.text(doc.splitTextToSize(dep.frecuencia || '-', depColW[2] - 2)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += depColW[2];

        doc.text(dep.nivel || '-', rowX + 1.5, currentY + 4);

        currentY += rowHeight;
      });

      currentY += 2;
    }

    // ---- DETALLES DE PREGUNTAS CONFIGURADAS POR BENEFICIARIO ----
    const renderDetalleBeneficiarios = (
      questionConfig: (typeof HEALTH_QUESTIONS)[number],
    ) => {
      const questionId = questionConfig.id;
      const question = data.salud.preguntas[questionId];
      const details = data.salud.detallesAclaracion?.[questionId] || [];

      if (question?.respuesta !== 'SÍ' || details.length === 0) return;

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
        questionConfig.beneficiaryDetailLabels?.campo1 || 'Detalle 1',
        questionConfig.beneficiaryDetailLabels?.campo2 || 'Detalle 2',
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
        doc.text(`#${detail.codigoAfiliado}`, rowX + 2, currentY + 4);
        rowX += detailColWidths[0];
        doc.text(doc.splitTextToSize(detail.campo1 || '-', detailColWidths[1] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        rowX += detailColWidths[1];
        doc.text(doc.splitTextToSize(detail.campo2 || '-', detailColWidths[2] - 3)[0] || '-', rowX + 1.5, currentY + 4);
        currentY += rowHeight;
      });

      currentY += 2;
    };

    HEALTH_QUESTIONS
      .filter((question) => question.beneficiaryDetail && question.id !== 17)
      .forEach(renderDetalleBeneficiarios);

    // ---- CONTINUAR CON LA SIGUIENTE SECCIÓN (FORMA DE PAGO, etc.) ----
    // (El código posterior a esta sección debe continuar sin cambios)
    // Evaluamos el espacio real necesario (aprox 24-26mm)
    if (currentY + 26 > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 22;
    }

    currentY = drawSectionTitle('5. Forma de Pago', currentY);
    const pago = data.pago;

    // Fila de celdas: Frecuencia, Moneda y Modalidad de Pago (Altura estándar 8.5mm)
    const cellHeight = 8.5;
    const modalidadTexto = `${pago.modalidadPago}${pago.especifiqueOtroPago ? ` (${pago.especifiqueOtroPago})` : ''}`;

    drawCell('Frecuencia de Pago', pago.frecuenciaPago, margin, currentY, thirdW, cellHeight);
    drawCell('Moneda de Pago', pago.moneda, margin + thirdW, currentY, thirdW, cellHeight);
    drawCell('Modalidad de Pago', modalidadTexto, margin + thirdW * 2, currentY, thirdW, cellHeight);

    // Avanzamos Y para la siguiente sección
    currentY += cellHeight + 3;
    // ================= PÁGINA 3 =================
    if (currentY + 90 > pageHeight - margin - 18) {
      doc.addPage();
      currentY = margin + 22;
    }

    // SECCIÓN 6: DECLARACIONES LEGALES SUDEASEG
    currentY = drawSectionTitle('6. Declaraciones y Autorizaciones Oficiales', currentY);

    // Declaración Titular
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
    const nomTit = `${data.titular.nombres} ${data.titular.apellidos}`.toUpperCase();
    const docTit = `${data.titular.tipoDoc}-${data.titular.numDoc}`;
    const textoTitular = `Yo, ${nomTit}, titular de la C.I. Nº ${docTit}, en mi condición de PROPUESTO AFILIADO TITULAR, declaro bajo fe de juramento que he leído cuidadosamente y totalmente, una a una, todas las preguntas y respuestas contenidas en esta solicitud y que ellas son verdaderas, completas y exactas, sin omitir ni falsear hecho alguno que pueda influir en la apreciación del riesgo por parte de PREVIASIS MEDICINA PREPAGADA S.A. Convengo en que esta solicitud constituirá la base del contrato. Asimismo, autorizo expresamente el envío de mensajes de datos, notificaciones electrónicas y la verificación de mi historial médico conforme a la normativa vigente de la República Bolivariana de Venezuela.`;
    const linesTitular = doc.splitTextToSize(textoTitular, contentWidth - 6);
    doc.text(linesTitular, margin + 3, currentY + 8.5);

    drawCheckbox('Acepto y ratifico la declaración del Afiliado Titular', data.firmas.aceptaDeclaracionTitular, margin + 3, currentY + 32);
    currentY += 38;

    // Declaración Contratante
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
    const nomCont = (data.contratante.esDiferente
      ? data.contratante.tipoPersona === 'Natural'
        ? `${data.contratante.personaNatural.nombres} ${data.contratante.personaNatural.apellidos}`
        : data.contratante.personaJuridica.razonSocial
      : nomTit).toUpperCase();
    const docCont = data.contratante.esDiferente
      ? data.contratante.tipoPersona === 'Natural'
        ? `${data.contratante.personaNatural.tipoDoc}-${data.contratante.personaNatural.numDoc}`
        : `${data.contratante.personaJuridica.tipoRif}-${data.contratante.personaJuridica.numRif}`
      : docTit;

    const textoFondos = `Yo, ${nomCont}, titular de la identificación Nº ${docCont}, en mi condición de CONTRATANTE, doy fe de que el dinero utilizado para el pago de las cuotas del PLAN DE SALUD proviene de una fuente lícita y legítima, no vinculada con actividades ilícitas ni de legitimación de capitales, de conformidad con la Ley Orgánica contra la Delincuencia Organizada y las normas de la Superintendencia de la Actividad Aseguradora.`;
    const linesFondos = doc.splitTextToSize(textoFondos, contentWidth - 6);
    doc.text(linesFondos, margin + 3, currentY + 8.5);

    drawCheckbox('Doy fe del origen lícito de los fondos', true, margin + 3, currentY + 28);
    currentY += 34;

    // Lugar y Fecha
    drawCell('Lugar de Suscripción', data.firmas.lugar || 'Barquisimeto, Venezuela', margin, currentY, halfW);
    drawCell('Fecha de Suscripción', data.firmas.fecha || data.header.fechaSolicitud || '-', margin + halfW, currentY, halfW);
    currentY += 11;

    // SECCIÓN 7: FIRMAS DIGITALES Y HUELLAS DACTILARES
    currentY = drawSectionTitle('7. Firmas y Huellas Dactilares Oficiales', currentY);

    const boxSignW = (contentWidth - 6) / 2;
    const boxSignH = 46;

    // Box 1: Titular
    doc.setDrawColor(7, 62, 35);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, boxSignW, boxSignH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(7, 62, 35);
    doc.text('PROPUESTO AFILIADO TITULAR', margin + 3, currentY + 4.5);

    if (data.firmas.firmaTitularBase64) {
      try {
        doc.addImage(data.firmas.firmaTitularBase64, 'PNG', margin + 4, currentY + 7, boxSignW - 28, 24);
      } catch (err) {
        console.error('Error incrustando firma titular:', err);
      }
    }

    // Huella Dactilar
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
    doc.text(nomTit, margin + 4, currentY + 38);
    doc.text(`C.I: ${docTit}`, margin + 4, currentY + 42);

    // Box 2: Contratante
    const contX = margin + boxSignW + 6;
    doc.setDrawColor(7, 62, 35);
    doc.rect(contX, currentY, boxSignW, boxSignH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(7, 62, 35);
    doc.text('CONTRATANTE / REPRESENTANTE LEGAL', contX + 3, currentY + 4.5);

    const sigContratante = data.firmas.firmaContratanteBase64 || data.firmas.firmaTitularBase64;
    if (sigContratante) {
      try {
        doc.addImage(sigContratante, 'PNG', contX + 4, currentY + 7, boxSignW - 28, 24);
      } catch (err) {
        console.error('Error incrustando firma contratante:', err);
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
    doc.text(nomCont, contX + 4, currentY + 38);
    doc.text(`ID: ${docCont}`, contX + 4, currentY + 42);

    currentY += boxSignH + 4;

    // SECCIÓN 8: INTERMEDIARIO
    currentY = drawSectionTitle('8. Intermediario de la Actividad Aseguradora', currentY);
    const inter = data.intermediario;
    drawCell('Nombre y Apellido del Intermediario', inter.nombreApellido, margin, currentY, thirdW * 1.2);
    drawCell('Nº Credencial Sudeaseg', inter.numCredencial, margin + thirdW * 1.2, currentY, thirdW * 0.8);
    drawCell('C.I. / R.I.F. / Pasaporte', `${inter.tipoDoc}-${inter.ciRifPasaporte}`, margin + thirdW * 2, currentY, thirdW);

    if (isDraft) {
      const totalPages = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.save();
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

  /**
   * Descarga directa del PDF
   */
  static async downloadPdf(
    data: SolicitudAfiliacionFormState,
    filename?: string,
    options: PdfGenerationOptions = {},
  ): Promise<void> {
    const doc = await this.generateSolicitudPdf(data, options);
    const name = filename || `Solicitud_Afiliacion_Previasis_${data.titular.numDoc || 'Doc'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(name);
  }

  /**
   * Obtiene la URL blob del PDF para vista previa
   */
  static async getPdfBlobUrl(
    data: SolicitudAfiliacionFormState,
    options: PdfGenerationOptions = {},
  ): Promise<string> {
    const doc = await this.generateSolicitudPdf(data, options);
    return doc.output('bloburl').toString();
  }

  private static async cargarImagen(url: string): Promise<HTMLImageElement> {
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
