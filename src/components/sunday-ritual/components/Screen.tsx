import React from 'react';
export interface ScreenProps {
  children: React.ReactNode;
  className?: string;
}
export function Screen({ children, className = '' }: ScreenProps) {
  return (
    <div
      className={`min-h-screen w-full bg-[#FAF7F2] p-4 md:p-8 flex items-center justify-center ${className}`}>

      <div className="w-full max-w-2xl">{children}</div>
    </div>);

}