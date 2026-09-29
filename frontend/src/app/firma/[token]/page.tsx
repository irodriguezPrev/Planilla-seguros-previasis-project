import { ClientSigningPage } from './ClientSigningPage';

export default async function RemoteSigningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientSigningPage token={token} />;
}
