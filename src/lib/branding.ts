export const getBranding = (defaults: any = {}) => {
  const name = process.env.NEXT_PUBLIC_BRAND_NAME || defaults.name || 'Your Business';
  const colour = process.env.NEXT_PUBLIC_BRAND_HEX || defaults.colour || '#146eff';
  const slogan = process.env.NEXT_PUBLIC_BRAND_SLOGAN || defaults.slogan || 'Protect every tool.';
  return { name, colour, slogan };
}