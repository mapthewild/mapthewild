import React from 'react';
export interface PostItProps {
  children: React.ReactNode;
  color: 'green' | 'yellow' | 'purple';
  rotation?: number;
  className?: string;
}
export function PostIt({
  children,
  color,
  rotation = 0,
  className = ''
}: PostItProps) {
  const colorStyles = {
    green: 'bg-[#D4F4DD] border-l-[#8BA888]',
    yellow: 'bg-[#FFF4CC] border-l-[#F4C430]',
    purple: 'bg-[#F0E6FF] border-l-[#9B87C4]'
  };
  return (
    <div
      className={`${colorStyles[color]} border-l-8 rounded p-6 shadow-[2px_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:rotate-0 hover:scale-[1.02] ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`
      }}>

      {children}
    </div>);

}