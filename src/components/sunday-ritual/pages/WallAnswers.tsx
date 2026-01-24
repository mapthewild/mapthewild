import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
export interface WallAnswersProps {
  partnerName: string;
  otherPartnerName: string;
  onComplete: (answers: {
    green: string;
    yellow: string;
    purple: string;
  }) => void;
}
export function WallAnswers({
  partnerName,
  otherPartnerName,
  onComplete
}: WallAnswersProps) {
  const [answers, setAnswers] = useState({
    green: '',
    yellow: '',
    purple: ''
  });
  const updateAnswer = (key: 'green' | 'yellow' | 'purple', value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const canContinue =
  answers.green.length > 10 &&
  answers.yellow.length > 10 &&
  answers.purple.length > 10;
  return (
    <Screen className="bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYnJpY2siIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkFGN0YyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjEiLz48cmVjdCB4PSIzMiIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjEiLz48cmVjdCB4PSIxNiIgeT0iMjIiIHdpZHRoPSIyOCIgaGVpZ2h0PSIxOCIgZmlsbD0iI0U4RDVCNyIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2JyaWNrKSIvPjwvc3ZnPg==')] bg-repeat">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-[#3A3A3A]">
            {partnerName}'s Turn to Type
          </h2>
          <p className="text-sm text-[#8A8A8A] italic">
            {otherPartnerName}, step away for ~5 minutes
          </p>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-[#D4F4DD] border-l-8 border-[#8BA888] rounded p-6 space-y-3">
            <div className="text-base font-semibold text-[#3A3A3A]">
              🟢 Grounding (Self)
            </div>
            <p className="text-sm text-[#5A5A5A] italic">
              "What is one thing strictly for YOU this week?"
            </p>
            <textarea
              value={answers.green}
              onChange={(e) => updateAnswer('green', e.target.value)}
              placeholder="e.g., Taking a long walk alone..."
              className="w-full p-4 bg-[#F0FAF2] border-none rounded text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#8BA888]"
              rows={4} />

          </div>

          <div className="bg-[#FFF4CC] border-l-8 border-[#F4C430] rounded p-6 space-y-3">
            <div className="text-base font-semibold text-[#3A3A3A]">
              🟡 The 50 Year Question
            </div>
            <p className="text-sm text-[#5A5A5A] italic">
              "If everything stays the same, what does today look like in 50
              years?"
            </p>
            <textarea
              value={answers.yellow}
              onChange={(e) => updateAnswer('yellow', e.target.value)}
              placeholder="Be honest. Is it comfortable or lonely?"
              className="w-full p-4 bg-[#FFFEF5] border-none rounded text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
              rows={4} />

          </div>

          <div className="bg-[#F0E6FF] border-l-8 border-[#9B87C4] rounded p-6 space-y-3">
            <div className="text-base font-semibold text-[#3A3A3A]">
              🟣 Your Pattern
            </div>
            <p className="text-sm text-[#5A5A5A] italic">
              "When the dance starts, what's one thing you could do
              differently?"
            </p>
            <textarea
              value={answers.purple}
              onChange={(e) => updateAnswer('purple', e.target.value)}
              placeholder="What could break the pattern?"
              className="w-full p-4 bg-[#FAF5FF] border-none rounded text-base resize-none focus:outline-none focus:ring-2 focus:ring-[#9B87C4]"
              rows={4} />

          </div>
        </div>

        {canContinue &&
        <div className="text-center pt-4 animate-[fadeIn_0.3s_ease-out]">
            <Button onClick={() => onComplete(answers)}>
              Save & Pass to {otherPartnerName} →
            </Button>
          </div>
        }
      </div>
    </Screen>);

}