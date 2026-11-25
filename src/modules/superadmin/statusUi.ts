export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

export const statusVariant = (s?: string): StatusVariant => {
  switch (s) {
    case 'ACTIVE':
      return 'success';
    case 'TRIAL':
      return 'info';
    case 'PAST_DUE':
      return 'warning';
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'danger';
    default:
      return 'secondary';
  }
};

export const money = (n: number | string | undefined | null) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
