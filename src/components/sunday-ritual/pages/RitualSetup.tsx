import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
export interface RitualSetupProps {
  onReady: (customRitual?: string) => void;
}
export function RitualSetup({ onReady }: RitualSetupProps) {
  const [checks, setChecks] = useState({
    drinks: false,
    couch: false,
    phones: false,
    candle: false
  });
  const [customRitual, setCustomRitual] = useState('');
  const toggleCheck = (key: keyof typeof checks) => {
    setChecks((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const checklistItems = [
  {
    key: 'drinks',
    icon: '☕',
    text: 'Grab your favorite drinks'
  },
  {
    key: 'couch',
    icon: '🛋️',
    text: 'Find your couch (side by side)'
  },
  {
    key: 'phones',
    icon: '📱',
    text: 'Silence your phones'
  },
  {
    key: 'candle',
    icon: '🕯️',
    text: 'Light a candle (vibes matter)'
  }];

  return (
    <Screen>
      <div className="space-y-8">
        <h1
          className="text-3xl md:text-4xl font-serif text-[#3A3A3A] text-center"
          style={{
            fontFamily: 'Libre Baskerville, serif'
          }}>

          Let's Set the Stage
        </h1>

        <p className="text-lg text-[#5A5A5A] text-center max-w-lg mx-auto">
          You're about to start a ritual most couples will envy. Make it
          special:
        </p>

        <div className="space-y-4 max-w-md mx-auto">
          {checklistItems.map(({ key, icon, text }) =>
          <button
            key={key}
            onClick={() => toggleCheck(key as keyof typeof checks)}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-[#E8D5B7] hover:border-[#8BA888] transition-all duration-200 text-left group">

              <div
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${checks[key as keyof typeof checks] ? 'bg-[#8BA888] border-[#8BA888] scale-110' : 'border-[#E8D5B7] group-hover:border-[#8BA888]'}`}>

                {checks[key as keyof typeof checks] &&
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">

                    <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7" />

                  </svg>
              }
              </div>
              <span className="text-2xl">{icon}</span>
              <span className="text-base text-[#3A3A3A]">{text}</span>
            </button>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <Input
            label="Optional: Add your own ritual"
            value={customRitual}
            onChange={setCustomRitual}
            placeholder="e.g., Play our favorite album..." />

        </div>

        <div className="text-center">
          <Button onClick={() => onReady(customRitual)}>We're Ready →</Button>
        </div>
      </div>
    </Screen>);

}