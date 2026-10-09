import { SignedDocumentViewer } from './SignedDocumentViewer';

export const metadata = {
  title: 'Documento firmado | PREVIASIS',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ signatureId: string }>;
}) {
  const { signatureId } = await params;
  return <SignedDocumentViewer signatureId={signatureId} />;
}
