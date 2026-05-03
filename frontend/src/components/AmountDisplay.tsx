import React from 'react';
import { formatCurrency } from '../utils/formatting';

interface AmountDisplayProps {
  amount: number;
  type: 'income' | 'expense';
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ amount, type, className = '' }) => {
  const isIncome = type === 'income';
  const sign = isIncome ? '+' : '-';
  const color = isIncome ? 'text-green-500' : 'text-red-500';

  return (
    <span className={`font-semibold ${color} ${className}`}>
      {sign}
      {formatCurrency(amount)}
    </span>
  );
};

export default AmountDisplay;
