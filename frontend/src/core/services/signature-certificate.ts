import type { jsPDF } from 'jspdf';
import { create as createQrCode } from 'qrcode';
import type { AffiliationFormState, SignatureEvidence } from '@/core/interfaces/affiliation.interfaces';

const missing = 'No registrado';
const timestamp = (value?: string | null) => {
  if (!value || !Number.isFinite(Date.parse(value))) return missing;
  return new Date(value).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
};

export function appendSignatureCertificate(doc: jsPDF, data: AffiliationFormState): void {
  const signatures = data.signatures;
  const contractor = data.contractor.personType === 'Juridica'
    ? data.contractor.legalEntity.legalRepresentative
    : data.contractor.naturalPerson;
  const entries = [
    {
      person: data.policyholder,
      role: data.contractor.isDifferent ? 'Titular' : 'Titular y contratante',
      signature: signatures.policyholderSignatureBase64,
      evidence: signatures.policyholderEvidence,
    },
    ...(data.contractor.isDifferent ? [{
      person: contractor,
      role: 'Contratante / Representante legal',
      signature: signatures.contractorSignatureBase64,
      evidence: signatures.contractorEvidence,
    }] : []),
  ].filter((entry) => entry.signature);
  if (!entries.length) return;

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('Certificación de firma', 12, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PREVIASIS · Solicitud de afiliación', 12, 30);

  const write = (text: string, x: number, y: number, width: number) => {
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * 3.6 + 2;
  };
  let top = 40;
  for (const entry of entries) {
    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, top, 192, 87, 3, 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Eventos del firmante', 16, top + 8);
    doc.text('Firma', 79, top + 8);
    doc.text('Detalles', 147, top + 8);
    doc.line(12, top + 12, 204, top + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let y = write([entry.person.firstNames, entry.person.lastNames].filter(Boolean).join(' '), 16, top + 19, 55);
    y = write(entry.person.email || missing, 16, y, 55);
    y = write(entry.role, 16, y, 55);
    write('Nivel de autenticación: ' + (
      entry.evidence?.authentication === 'link' ? 'Acceso mediante enlace'
        : entry.evidence?.authentication === 'local' ? 'Captura local' : missing
    ), 16, y + 2, 55);
    try {
      const size = doc.getImageProperties(entry.signature!);
      const scale = Math.min(59 / size.width, 22 / size.height);
      doc.addImage(entry.signature!, 'PNG', 79, top + 16, size.width * scale, size.height * scale);
    } catch {
      doc.text('Firma no disponible', 79, top + 24);
    }
    y = write('ID de firma: ' + (entry.evidence?.id || missing), 79, top + 43, 60);
    y = write('Dirección IP: ' + (entry.evidence?.ip || missing), 79, y, 60);
    const device = entry.evidence?.device || missing;
    const deviceLines = doc.splitTextToSize('Dispositivo: ' + device, 60) as string[];
    doc.text(deviceLines.slice(0, 5).map((line, i) => i === 4 && deviceLines.length > 5 ? line + '...' : line), 79, y);
    const evidence: SignatureEvidence | null | undefined = entry.evidence;
    y = write('Enviado: ' + timestamp(evidence?.sentAt), 147, top + 19, 53);
    y = write('Visto: ' + timestamp(evidence?.viewedAt), 147, y, 53);
    write('Firmado: ' + timestamp(evidence?.signedAt), 147, y, 53);
    if (evidence?.id && evidence.authentication === 'link' && typeof window !== 'undefined') {
      const documentUrl = new URL('/documento/' + encodeURIComponent(evidence.id), window.location.origin).href;
      const qr = createQrCode(documentUrl, { errorCorrectionLevel: 'M' });
      const quietZone = 4;
      const side = 29;
      const cell = side / (qr.modules.size + quietZone * 2);
      const x = 147;
      const qrY = top + 48;
      doc.setFillColor(255, 255, 255);
      doc.rect(x, qrY, side, side, 'F');
      doc.setFillColor(0, 0, 0);
      for (let row = 0; row < qr.modules.size; row++) {
        for (let col = 0; col < qr.modules.size; col++) {
          if (qr.modules.get(row, col)) {
            doc.rect(x + (col + quietZone) * cell, qrY + (row + quietZone) * cell, cell, cell, 'F');
          }
        }
      }
      doc.setFontSize(7);
      doc.text('Escanee para ver el documento', x, top + 81);
      doc.link(x, qrY, side, side, { url: documentUrl });
    }
    top += 94;
  }
  doc.setFontSize(8);
  write('Constancia de firma electrónica y de los datos registrados durante la operación. El ID identifica el registro; no constituye un certificado digital emitido por una autoridad certificadora.', 12, top + 3, 192);
}
