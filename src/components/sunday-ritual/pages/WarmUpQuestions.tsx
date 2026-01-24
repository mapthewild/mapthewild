import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ProgressDots } from '../components/ProgressDots';
export interface WarmUpQuestionsProps {
  partnerName: string;
  otherPartnerName: string;
  onComplete: (answers: WarmUpAnswers) => void;
}
export interface WarmUpAnswers {
  valuesMost: string;
  showLove: string;
  goodLooksLike: string;
}
export function WarmUpQuestions({
  partnerName,
  otherPartnerName,
  onComplete
}: WarmUpQuestionsProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WarmUpAnswers>({
    valuesMost: '',
    showLove: '',
    goodLooksLike: ''
  });
  const updateAnswer = (key: keyof WarmUpAnswers, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const canContinue = () => {
    if (step === 0) return answers.valuesMost.length > 10;
    if (step === 1) return answers.showLove.length > 10;
    if (step === 2) return answers.goodLooksLike.length > 10;
    return false;
  };
  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };
  return (
    <Screen>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 bg-[#FFF5F2] border-2 border-[#E07856] rounded-lg p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-[#E07856]">
              {partnerName}'s Turn
            </h2>
            <span className="text-sm font-semibold text-[#E07856] bg-white px-3 py-1 rounded-full">
              Question {step + 1}/3
            </span>
          </div>
          <ProgressDots current={step} total={3} />
          <p className="text-base text-[#5A5A5A] font-medium">
            {otherPartnerName}, come back in ~7 minutes
          </p>
        </div>

        {/* Question 1: What do you value most? */}
        {step === 0 &&
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <svg viewBox="0 0 300 200" className="w-full max-w-xs mx-auto">
              {/* Heart with compass points */}
              <path
              d="M 150 170 C 150 170, 120 140, 120 120 C 120 100, 130 90, 150 90 C 170 90, 180 100, 180 120 C 180 140, 150 170, 150 170 Z"
              fill="#E07856"
              opacity="0.3" />

              <circle
              cx="150"
              cy="120"
              r="40"
              fill="none"
              stroke="#8BA888"
              strokeWidth="2"
              strokeDasharray="5,5" />

              <line
              x1="150"
              y1="80"
              x2="150"
              y2="90"
              stroke="#8BA888"
              strokeWidth="2" />

              <line
              x1="150"
              y1="150"
              x2="150"
              y2="160"
              stroke="#8BA888"
              strokeWidth="2" />

              <line
              x1="110"
              y1="120"
              x2="120"
              y2="120"
              stroke="#8BA888"
              strokeWidth="2" />

              <line
              x1="180"
              y1="120"
              x2="190"
              y2="120"
              stroke="#8BA888"
              strokeWidth="2" />

            </svg>

            <div className="bg-[#FFFEF8] border-l-8 border-[#8BA888] rounded-lg p-6 space-y-4 max-w-lg mx-auto">
              <h3
              className="text-2xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

                🧭 Your North Star
              </h3>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                When you think about your relationship, what matters most to
                you?
              </p>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                Not what you think you <em>should</em> value—what actually
                lights you up when it's there?
              </p>

              <p className="text-sm text-[#8A8A8A] italic">
                (Examples: adventure together, feeling understood, shared quiet
                mornings, building something, feeling safe to be weird...)
              </p>

              <Input
              label="What I value most in us:"
              value={answers.valuesMost}
              onChange={(val) => updateAnswer('valuesMost', val)}
              multiline
              rows={4}
              placeholder="e.g., Laughing until we cry at stupid jokes... or Feeling like we're on the same team..." />

            </div>
          </div>
        }

        {/* Question 2: How do you show love? */}
        {step === 1 &&
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <svg viewBox="0 0 300 200" className="w-full max-w-xs mx-auto">
              {/* Two hands reaching toward each other */}
              <path
              d="M 80 120 L 100 110 L 105 120 L 100 130 L 80 140 Z"
              fill="#E07856"
              opacity="0.5" />

              <path
              d="M 220 120 L 200 110 L 195 120 L 200 130 L 220 140 Z"
              fill="#8BA888"
              opacity="0.5" />

              <circle cx="150" cy="120" r="15" fill="#F4C430" opacity="0.6" />
            </svg>

            <div className="bg-[#FFFEF5] border-l-8 border-[#F4C430] rounded-lg p-6 space-y-4 max-w-lg mx-auto">
              <h3
              className="text-2xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

                💛 How You Love
              </h3>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                Think about a moment recently when you felt really connected to{' '}
                {otherPartnerName}.
              </p>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                What were you doing? What made it feel good?
              </p>

              <p className="text-sm text-[#8A8A8A] italic">
                (This isn't about grand gestures—it's about noticing what
                actually creates connection for you two.)
              </p>

              <Input
              label="A recent moment that felt good:"
              value={answers.showLove}
              onChange={(val) => updateAnswer('showLove', val)}
              multiline
              rows={4}
              placeholder="e.g., Saturday morning when we made pancakes and didn't check our phones... or When they texted me that meme at exactly the right moment..." />

            </div>
          </div>
        }

        {/* Question 3: What does "good" look like? */}
        {step === 2 &&
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <svg viewBox="0 0 300 200" className="w-full max-w-xs mx-auto">
              {/* Future vision - two figures looking at horizon */}
              <circle cx="100" cy="100" r="20" fill="#E07856" opacity="0.4" />
              <rect
              x="85"
              y="120"
              width="30"
              height="50"
              rx="15"
              fill="#E07856"
              opacity="0.4" />

              <circle cx="200" cy="100" r="20" fill="#8BA888" opacity="0.4" />
              <rect
              x="185"
              y="120"
              width="30"
              height="50"
              rx="15"
              fill="#8BA888"
              opacity="0.4" />

              <ellipse
              cx="150"
              cy="80"
              rx="60"
              ry="20"
              fill="#F4C430"
              opacity="0.2" />

            </svg>

            <div className="bg-[#FFF5F2] border-l-8 border-[#E07856] rounded-lg p-6 space-y-4 max-w-lg mx-auto">
              <h3
              className="text-2xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

                🌅 Your Vision
              </h3>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                Imagine it's a year from now, and you're telling a friend about
                your relationship.
              </p>

              <p className="text-base text-[#5A5A5A] leading-relaxed">
                What would you want to be able to say? What would make you feel
                proud or grateful?
              </p>

              <p className="text-sm text-[#8A8A8A] italic">
                (Dream a little—what does "good" actually look like for you?)
              </p>

              <Input
              label="A year from now, I hope we..."
              value={answers.goodLooksLike}
              onChange={(val) => updateAnswer('goodLooksLike', val)}
              multiline
              rows={4}
              placeholder="e.g., ...have a weekly ritual we actually keep or ...fight less and laugh more or ...feel like partners, not roommates" />

            </div>
          </div>
        }

        {/* Navigation */}
        <div className="text-center pt-4">
          <Button onClick={handleNext} disabled={!canContinue()}>
            {step < 2 ? 'Next Question →' : "I'm Done →"}
          </Button>
        </div>
      </div>
    </Screen>);

}