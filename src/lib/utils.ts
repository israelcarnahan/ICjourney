export const cn = (...classes: any[]) =>
  classes.filter(Boolean).join(' ');
