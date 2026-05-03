import { useMemo } from 'react';
import { useCategories } from './useApi';

export const useCategoryMap = () => {
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      },
      {} as Record<string, typeof categories[0]>
    );
  }, [categories]);
};

export const useExpenseCategories = () => {
  const { data: categories = [] } = useCategories();
  return useMemo(() => categories.filter((cat) => cat.type === 'expense'), [categories]);
};

export const useIncomeCategories = () => {
  const { data: categories = [] } = useCategories();
  return useMemo(() => categories.filter((cat) => cat.type === 'income'), [categories]);
};
