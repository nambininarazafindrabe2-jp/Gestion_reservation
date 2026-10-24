const NF = new Intl.NumberFormat('fr-FR');
export const nf = (n: number): string => NF.format(n);

const MGA = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 });
export const ariary = (n: string | number): string => MGA.format(Number(n) || 0);

export const PHONE_HELP =
  'Le contact doit contenir exactement 10 chiffres, sans espace ni caractère spécial.';
export const sanitizeContact = (raw: string): string =>
  String(raw ?? '').replace(/[^0-9]/g, '').slice(0, 10);
export const isValidPhone = (value: string): boolean => /^[0-9]{10}$/.test(value);

export const firstEmpty = (fields: [string, unknown][]): string | null => {
  const f = fields.find(([, v]) => String(v ?? '').trim() === '');
  return f ? f[0] : null;
};