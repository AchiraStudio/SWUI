// Shared UI components & design system tokens across all SWUI documents

export interface HealthBarProps {
  current: number;
  max: number;
}

export function formatCredits(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
