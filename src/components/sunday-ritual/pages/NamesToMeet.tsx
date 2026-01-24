import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { TwoChairsIllustration } from '../components/Illustrations';
export interface NamesToMeetProps {
  onContinue: (data: {
    partner1: string;
    partner2: string;
    appreciation1: string;
    appreciation2: string;
  }) => void;
}
export function NamesToMeet({ onContinue }: NamesToMeetProps) {
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [appreciation1, setAppreciation1] = useState('');
  const [appreciation2, setAppreciation2] = useState('');
  const canContinue = partner1 && partner2 && appreciation1 && appreciation2;
  return (
    <Screen>
      <div className="space-y-8">
        <h1
          className="text-3xl md:text-4xl font-serif text-[#3A3A3A] text-center"
          style={{
            fontFamily: 'Libre Baskerville, serif'
          }}>

          Nice to Meet You
        </h1>

        <div className="my-6">
          <TwoChairsIllustration filled={!!(partner1 && partner2)} />
        </div>

        <p className="text-lg text-[#5A5A5A] text-center">
          Before we start, I need to know who I'm talking with.
        </p>

        <div className="space-y-6 max-w-md mx-auto">
          <Input
            label="Partner 1"
            value={partner1}
            onChange={setPartner1}
            placeholder="Your name" />


          <Input
            label="Partner 2"
            value={partner2}
            onChange={setPartner2}
            placeholder="Your partner's name" />

        </div>

        {partner1 && partner2 &&
        <div className="space-y-6 max-w-md mx-auto pt-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full h-0.5 bg-[#E8D5B7]"></div>

            <p className="text-lg text-[#5A5A5A] text-center">
              One more thing before we dig in.
            </p>

            <Input
            label={`${partner1}, what's one thing ${partner2} did this week that made you smile?`}
            value={appreciation1}
            onChange={setAppreciation1}
            multiline
            rows={3}
            placeholder="Something small counts..." />


            <Input
            label={`${partner2}, your turn:`}
            value={appreciation2}
            onChange={setAppreciation2}
            multiline
            rows={3}
            placeholder="What made you smile?" />

          </div>
        }

        {canContinue &&
        <div className="text-center pt-4 animate-[fadeIn_0.3s_ease-out]">
            <Button
            onClick={() =>
            onContinue({
              partner1,
              partner2,
              appreciation1,
              appreciation2
            })
            }>

              Continue →
            </Button>
          </div>
        }
      </div>
    </Screen>);

}