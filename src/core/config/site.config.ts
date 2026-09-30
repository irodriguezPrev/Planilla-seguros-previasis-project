export const siteConfig = {
  name: 'PREVIASIS Medicina Prepagada S.A.',
  description: 'Plataforma oficial de afiliación y emisión de pólizas de salud autorizada por Sudeaseg (Providencia Nº SAA-09-1585)',
  version: '1.0.0',
  rif: 'J-412048970',
  sudeasegId: 'MP-000015',
  links: {
    docs: '/info',
    swagger: 'http://localhost:3004/swagger/#',
  },
  navigation: [
    { label: 'Afiliación', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Usuarios', href: '/dashboard/users' },
  ],
};

export default siteConfig;
