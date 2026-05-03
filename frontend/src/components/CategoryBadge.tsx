import React from 'react';
import { Category } from '../types/index';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor: category.color + '20',
        color: category.color,
        border: `1px solid ${category.color}40`,
      }}
    >
      {category.icon && <span className="text-base">{category.icon}</span>}
      <span>{category.name}</span>
    </div>
  );
};

export default CategoryBadge;
