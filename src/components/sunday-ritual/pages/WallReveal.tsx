import React, { useState } from 'react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { PostIt } from '../components/PostIt';
export interface WallRevealProps {
  partner1: string;
  partner2: string;
  onContinue: (mode: 'turns' | 'analog') => void;
}
export function WallReveal({
  partner1,
  partner2,
  onContinue
}: WallRevealProps) {
  const [selectedMode, setSelectedMode] = useState<'turns' | 'analog' | null>(
    null
  );
  return (
    <Screen className="bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYnJpY2siIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkFGN0YyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjEiLz48cmVjdCB4PSIzMiIgeT0iMCIgd2lkdGg9IjI4IiBoZWlnaHQ9IjE4IiBmaWxsPSIjRThENUI3IiBvcGFjaXR5PSIwLjEiLz48cmVjdCB4PSIxNiIgeT0iMjIiIHdpZHRoPSIyOCIgaGVpZ2h0PSIxOCIgZmlsbD0iI0U4RDVCNyIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2JyaWNrKSIvPjwvc3ZnPg==')] bg-repeat">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            The Wall
          </h1>
          <p className="text-lg text-[#5A5A5A]">Not to keep things out.</p>
          <p className="text-lg text-[#5A5A5A] font-medium">
            To hold things up.
          </p>
        </div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <p className="text-base text-[#5A5A5A] text-center max-w-lg mx-auto">
          Based on your warm-up, here are your questions:
        </p>

        <div className="space-y-6 max-w-2xl mx-auto">
          <PostIt color="green" rotation={-1}>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-[#3A3A3A]">
                🟢 GROUNDING (SELF)
              </div>
              <p className="text-base text-[#5A5A5A] italic">
                "Eroticism thrives in the space between self and other. What is
                one thing strictly for YOU this week?"
              </p>
            </div>
          </PostIt>

          <PostIt color="yellow" rotation={1}>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-[#3A3A3A]">
                🟡 PERSPECTIVE (US)
              </div>
              <p className="text-base text-[#5A5A5A] italic">
                "If everything stays exactly the same, what does today look like
                in 50 years?"
              </p>
            </div>
          </PostIt>

          <PostIt color="purple" rotation={-0.5}>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-[#3A3A3A]">
                🟣 YOUR PATTERN
              </div>
              <p className="text-base text-[#5A5A5A] italic">
                "When the dance starts, what's one thing you could do
                differently to break the pattern?"
              </p>
            </div>
          </PostIt>
        </div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <div className="space-y-4 max-w-lg mx-auto">
          <p className="text-lg font-semibold text-[#3A3A3A] text-center">
            CHOOSE HOW TO ANSWER
          </p>

          <button
            onClick={() => setSelectedMode('turns')}
            className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${selectedMode === 'turns' ? 'bg-[#FFF0ED] border-[#E07856] border-[3px]' : 'bg-white border-[#E8D5B7] hover:border-[#E07856]'}`}>

            <div className="font-semibold text-[#3A3A3A] mb-2">
              Take Turns (Recommended)
            </div>
            <div className="text-sm text-[#5A5A5A]">
              One person types while the other steps away. Then switch.
            </div>
          </button>

          <button
            onClick={() => setSelectedMode('analog')}
            className={`w-full p-6 rounded-lg border-2 transition-all duration-200 text-left ${selectedMode === 'analog' ? 'bg-[#FFF0ED] border-[#E07856] border-[3px]' : 'bg-white border-[#E8D5B7] hover:border-[#E07856]'}`}>

            <div className="font-semibold text-[#3A3A3A] mb-2">Go Analog</div>
            <div className="text-sm text-[#5A5A5A]">
              Grab actual post-its. Write by hand. Stick them on your wall.
            </div>
          </button>
        </div>

        {selectedMode &&
        <div className="text-center pt-4 animate-[fadeIn_0.3s_ease-out]">
            <Button onClick={() => onContinue(selectedMode)}>
              {selectedMode === 'turns' ?
            'Start Taking Turns →' :
            'Continue Without Typing →'}
            </Button>
          </div>
        }
      </div>
    </Screen>);

}