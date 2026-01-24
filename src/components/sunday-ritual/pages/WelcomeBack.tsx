import React from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { TogetherIllustration } from '../components/Illustrations';
export interface WelcomeBackProps {
  partner1: string;
  partner2: string;
  onContinue: () => void;
}
export function WelcomeBack({
  partner1,
  partner2,
  onContinue
}: WelcomeBackProps) {
  return (
    <Screen>
      <div className="space-y-8">
        <div className="my-6">
          <TogetherIllustration />
        </div>

        <div className="text-center space-y-3">
          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            Welcome Back, Both of You
          </h1>
          <p className="text-lg text-[#5A5A5A]">The solo work is done.</p>
          <p className="text-lg text-[#5A5A5A]">
            From here, you're doing this together.
          </p>
        </div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <div className="bg-[#FFFEF8] border-l-4 border-[#8BA888] rounded-lg p-6 max-w-lg mx-auto space-y-4">
          <p className="font-semibold text-[#3A3A3A]">Why you did this:</p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            You each just spent time thinking about what matters to you, what
            connection feels like, and where you want to go.
          </p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            Now you'll see what you both said—side by side. Not to compare or
            judge, but to notice where you overlap, where you're different, and
            what that tells you.
          </p>
          <p className="text-base text-[#5A5A5A] leading-relaxed font-medium">
            This is about building something together, not fixing what's broken.
          </p>
        </div>

        <div className="bg-[#F0F4F0] border-2 border-dashed border-[#8BA888] rounded-lg p-6 max-w-lg mx-auto space-y-3">
          <p className="font-semibold text-[#3A3A3A]">Get comfortable:</p>
          <ul className="space-y-2 text-[#5A5A5A]">
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Couch works best (side by side, shared screen)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Or across a table (rotating the device)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>~20 minutes from here</span>
            </li>
          </ul>
        </div>

        <p className="text-lg text-center text-[#5A5A5A] font-medium">
          You both showed up. That matters.
        </p>

        <div className="text-center pt-4">
          <Button onClick={onContinue}>See What You Built →</Button>
        </div>
      </div>
    </Screen>);

}