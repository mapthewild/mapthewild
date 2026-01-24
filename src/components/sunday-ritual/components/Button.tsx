import React from 'react';
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  className?: string;
}
export function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth = false,
  className = ''
}: ButtonProps) {
  const baseStyles =
  'px-8 py-4 rounded-lg font-semibold transition-all duration-200 text-base';
  const variantStyles = {
    primary:
    'bg-[#E07856] text-white shadow-[0_4px_12px_rgba(224,120,86,0.15)] hover:bg-[#D66847] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(224,120,86,0.25)]',
    secondary:
    'bg-white text-[#3A3A3A] border-2 border-[#E8D5B7] hover:border-[#E07856] hover:-translate-y-0.5'
  };
  const widthStyles = fullWidth ? 'w-full' : '';
  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}>

      {children}
    </button>);

}