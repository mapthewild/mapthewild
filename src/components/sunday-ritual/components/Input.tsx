import React, { Component } from 'react';
export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}
export function Input({
  value,
  onChange,
  placeholder,
  label,
  multiline = false,
  rows = 4,
  className = ''
}: InputProps) {
  const baseStyles =
  'w-full px-4 py-3 bg-white border-2 border-[#E8D5B7] rounded-lg text-base transition-all duration-200 focus:border-[#8BA888] focus:outline-none focus:ring-4 focus:ring-[#8BA888]/10';
  const Component = multiline ? 'textarea' : 'input';
  return (
    <div className={className}>
      {label &&
      <label className="block text-sm font-medium text-[#3A3A3A] mb-2">
          {label}
        </label>
      }
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className={`${baseStyles} ${multiline ? 'resize-none' : ''}`} />

    </div>);

}