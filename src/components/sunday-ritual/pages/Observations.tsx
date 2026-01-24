import React from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
export interface ObservationsProps {
  partner1: string;
  partner2: string;
  onContinue: () => void;
}
export function Observations({
  partner1,
  partner2,
  onContinue
}: ObservationsProps) {
  return (
    <Screen>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            What I'm Seeing
          </h1>

          <svg viewBox="0 0 200 150" className="w-32 mx-auto">
            <circle
              cx="100"
              cy="75"
              r="50"
              fill="none"
              stroke="#E07856"
              strokeWidth="3" />

            <path
              d="M 70 75 Q 85 65 100 75 Q 115 85 130 75"
              stroke="#8BA888"
              strokeWidth="3"
              fill="none" />

            <circle cx="85" cy="65" r="3" fill="#3A3A3A" />
            <circle cx="115" cy="65" r="3" fill="#3A3A3A" />
          </svg>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg p-6 border-l-4 border-[#E07856]">
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-4">
              THE DYNAMIC
            </h2>
            <p className="text-base text-[#5A5A5A] leading-relaxed mb-3">
              You're in a classic "Demand-Withdraw" loop. {partner1}, your Check
              Engine light goes off when tension builds. {partner2}, when that
              happens, you tend to need space to process.
            </p>
            <p className="text-base text-[#5A5A5A] leading-relaxed">
              Neither is wrong. But when they collide without a plan, it creates
              the exact friction you described.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border-l-4 border-[#8BA888]">
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-4">
              THE THEORY THAT APPLIES
            </h2>
            <p className="text-base text-[#5A5A5A] leading-relaxed mb-3">
              Marriages don't fail from one big thing. They erode slowly when
              partners stop negotiating.
            </p>
            <p className="text-base text-[#5A5A5A] leading-relaxed">
              Your 50-year answers suggest you're aware of this pattern. That
              awareness is rare and valuable.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border-l-4 border-[#F4C430]">
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-4">
              WHAT TO DO WITH THIS
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">
                  1. THE IMMEDIATE THING
                </h3>
                <p className="text-base text-[#5A5A5A] mb-2">
                  This week, when the dance starts:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="text-base text-[#5A5A5A]">
                    → {partner1}: Name it. "I think we're doing the dance."
                  </li>
                  <li className="text-base text-[#5A5A5A]">
                    → {partner2}: Confirm it. "Yeah, we are."
                  </li>
                  <li className="text-base text-[#5A5A5A]">
                    → Both: Agree when you'll come back to it. Write it down.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">
                  2. THE ONGOING PRACTICE
                </h3>
                <p className="text-base text-[#5A5A5A] mb-2">
                  Relationships need renegotiation.
                </p>
                <p className="text-base text-[#5A5A5A] mb-2">
                  Three slow erosions to watch:
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="text-base text-[#5A5A5A]">
                    • Honesty (small resentments)
                  </li>
                  <li className="text-base text-[#5A5A5A]">
                    • Autonomy (I dies for We)
                  </li>
                  <li className="text-base text-[#5A5A5A]">
                    • Evolution (no updates)
                  </li>
                </ul>
                <p className="text-base text-[#5A5A5A] mt-3">
                  Your practice: Do this wall again in 6 months.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">
                  3. THE PARADOX TO HOLD
                </h3>
                <p className="text-base text-[#5A5A5A] italic mb-2">
                  "Love seeks closeness. Desire needs distance."
                </p>
                <p className="text-base text-[#5A5A5A]">
                  You can't eliminate this tension. You can only negotiate it
                  consciously.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Button onClick={onContinue}>Save Your Wall →</Button>
        </div>
      </div>
    </Screen>);

}