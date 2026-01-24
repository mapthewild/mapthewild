import React from 'react';
export interface ProgressDotsProps {
  current: number;
  total: number;
}
export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({
        length: total
      }).map((_, i) =>
      <div
        key={i}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-[#E07856] w-6' : 'bg-[#E8D5B7]'}`} />

      )}
    </div>);

}