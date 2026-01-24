import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PostIt } from '../components/PostIt';
export interface WallCompleteProps {
  partner1: string;
  partner2: string;
  partner1Answers: {
    green: string;
    yellow: string;
    purple: string;
  };
  partner2Answers: {
    green: string;
    yellow: string;
    purple: string;
  };
  onContinue: (appreciations: {p1: string;p2: string;}) => void;
}
export function WallComplete({
  partner1,
  partner2,
  partner1Answers,
  partner2Answers,
  onContinue
}: WallCompleteProps) {
  const [appreciations, setAppreciations] = useState({
    p1: '',
    p2: ''
  });
  const canContinue = appreciations.p1.length > 5 && appreciations.p2.length > 5;
  return (
    <Screen className="bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYnJpY2siIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkFGN0YyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjE1Ii8+PHJlY3QgeD0iMzIiIHk9IjAiIHdpZHRoPSIyOCIgaGVpZ2h0PSIxOCIgZmlsbD0iI0U4RDVCNyIgb3BhY2l0eT0iMC4xNSIvPjxyZWN0IHg9IjE2IiB5PSIyMiIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjE1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2JyaWNrKSIvPjwvc3ZnPg==')] bg-repeat">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            The Wall
          </h1>
          <p className="text-lg text-[#5A5A5A]">
            Read each other's answers. Discuss.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Partner 1 Column */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-[#3A3A3A] text-center">
              {partner1}
            </h3>

            <PostIt color="green" rotation={-1}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟢 SELF
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner1Answers.green}
                </p>
              </div>
            </PostIt>

            <PostIt color="yellow" rotation={1}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟡 FUTURE
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner1Answers.yellow}
                </p>
              </div>
            </PostIt>

            <PostIt color="purple" rotation={-0.5}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟣 PATTERN
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner1Answers.purple}
                </p>
              </div>
            </PostIt>
          </div>

          {/* Partner 2 Column */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-[#3A3A3A] text-center">
              {partner2}
            </h3>

            <PostIt color="green" rotation={1}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟢 SELF
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner2Answers.green}
                </p>
              </div>
            </PostIt>

            <PostIt color="yellow" rotation={-1}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟡 FUTURE
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner2Answers.yellow}
                </p>
              </div>
            </PostIt>

            <PostIt color="purple" rotation={0.5}>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#3A3A3A]">
                  🟣 PATTERN
                </div>
                <p className="text-sm text-[#5A5A5A]">
                  {partner2Answers.purple}
                </p>
              </div>
            </PostIt>
          </div>
        </div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-2xl mx-auto"></div>

        <div className="space-y-6 max-w-lg mx-auto">
          <p className="text-lg font-semibold text-[#3A3A3A] text-center">
            One Last Thing Before Insights
          </p>

          <Input
            label={`${partner1}: Name one thing you appreciate about ${partner2} showing up today.`}
            value={appreciations.p1}
            onChange={(val) =>
            setAppreciations((prev) => ({
              ...prev,
              p1: val
            }))
            }
            multiline
            rows={3} />


          <Input
            label={`${partner2}: Name one thing you appreciate about ${partner1} showing up today.`}
            value={appreciations.p2}
            onChange={(val) =>
            setAppreciations((prev) => ({
              ...prev,
              p2: val
            }))
            }
            multiline
            rows={3} />

        </div>

        {canContinue &&
        <div className="text-center pt-4 animate-[fadeIn_0.3s_ease-out]">
            <Button onClick={() => onContinue(appreciations)}>
              See Facilitator Observations →
            </Button>
          </div>
        }
      </div>
    </Screen>);

}