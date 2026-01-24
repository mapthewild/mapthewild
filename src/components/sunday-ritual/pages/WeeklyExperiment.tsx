import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
export interface WeeklyExperimentProps {
  partner1Name: string;
  partner2Name: string;
  onComplete: (experiment: string) => void;
}
export function WeeklyExperiment({
  partner1Name,
  partner2Name,
  onComplete
}: WeeklyExperimentProps) {
  const [experiment, setExperiment] = useState('');
  const [showCard, setShowCard] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const canContinue = experiment.length > 10;
  const handleSave = () => {
    console.log('handleSave called, experiment:', experiment);
    setShowCard(true);
  };
  const handleFinish = () => {
    onComplete(experiment);
  };
  const quote =
  'The goal is not to be perfect by the end. The goal is to be better today than yesterday.';
  console.log(
    'WeeklyExperiment render - showCard:',
    showCard,
    'experiment:',
    experiment,
    'canContinue:',
    canContinue
  );
  if (showCard) {
    return (
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        className="min-h-screen flex items-center justify-center py-20 px-6">

        <div className="max-w-2xl mx-auto w-full">
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="text-center space-y-3 mb-12">

            <h1
              className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

              Your Ritual Card
            </h1>
            <p className="text-lg text-[#5A5A5A]">Click to flip</p>
          </motion.div>

          {/* The Card */}
          <div
            className="relative cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              perspective: '1500px',
              maxWidth: '400px',
              margin: '0 auto'
            }}>

            <motion.div
              initial={{
                scale: 0.8,
                opacity: 0,
                rotateY: -90
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotateY: isFlipped ? 180 : 0
              }}
              transition={{
                duration: 0.8,
                ease: 'easeInOut'
              }}
              style={{
                transformStyle: 'preserve-3d',
                position: 'relative',
                aspectRatio: '2/3'
              }}>

              {/* FRONT - Their Experiment */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#FFFEF8] to-[#FFF5F2] rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  border: '3px solid #E8D5B7',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}>

                <div className="p-12 flex flex-col items-center justify-between h-full">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#E07856] uppercase tracking-wider mb-3">
                      This Week's Experiment
                    </div>
                    <div className="w-16 h-0.5 bg-[#E07856] mx-auto"></div>
                  </div>

                  <div className="flex-1 flex items-center">
                    <p
                      className="text-2xl font-serif leading-relaxed text-center text-[#3A3A3A]"
                      style={{
                        fontFamily: 'Libre Baskerville, serif'
                      }}>

                      "{experiment}"
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-base text-[#8A8A8A] mb-2">
                      {partner1Name} & {partner2Name}
                    </p>
                    <p className="text-xs text-[#8A8A8A] opacity-40 mt-8">
                      Tap to see your quote
                    </p>
                  </div>
                </div>
              </div>

              {/* BACK - Quote */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#8BA888] to-[#6B9B6B] rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  border: '3px solid #8BA888',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}>

                <div className="p-12 flex flex-col items-center justify-between h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💚</div>
                  </div>

                  <div className="flex-1 flex items-center">
                    <p
                      className="text-2xl font-serif leading-relaxed text-center text-white italic"
                      style={{
                        fontFamily: 'Libre Baskerville, serif'
                      }}>

                      {quote}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-white/80 uppercase tracking-wider mb-2">
                      ☀️ Sunday Ritual
                    </div>
                    <p className="text-xs text-white/40 mt-8">Tap to return</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="text-center mt-12 space-y-4"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            transition={{
              delay: 1.2
            }}>

            <p className="text-sm text-[#8A8A8A] italic">
              Screenshot this to keep it with you
            </p>
            <Button onClick={handleFinish}>Finish Ritual →</Button>
          </motion.div>
        </div>
      </motion.div>);

  }
  return (
    <Screen>
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            This Week's Experiment
          </h1>
          <p className="text-lg text-[#5A5A5A]">
            Not homework. Just one small thing to try.
          </p>
        </div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-2xl mx-auto"></div>

        <div className="bg-[#FFFEF8] border-l-4 border-[#8BA888] rounded-lg p-6 max-w-2xl mx-auto space-y-4">
          <p className="font-semibold text-[#3A3A3A]">What we're noticing:</p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            You both showed up. You identified what matters. You noticed where
            reality doesn't match the vision.
          </p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            That's the work. Everything else is just practice.
          </p>
        </div>

        <div className="bg-[#FFF5F2] border-l-8 border-[#E07856] rounded-lg p-6 max-w-2xl mx-auto space-y-4">
          <h3
            className="text-xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            Your Experiment
          </h3>

          <p className="text-base text-[#5A5A5A] leading-relaxed">
            Based on what you talked about, what's ONE tiny thing you could try
            this week?
          </p>

          <p className="text-sm text-[#8A8A8A] italic">
            Make it specific. Make it small. Make it something you can actually
            do.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#5A5A5A]">Examples:</p>
            <ul className="space-y-2 text-sm text-[#5A5A5A]">
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>One 20-minute walk together, no phones, this week</span>
              </li>
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>
                  Ask "how was your day?" and actually listen for 5 minutes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>→</span>
                <span>Cook one meal together instead of ordering in</span>
              </li>
            </ul>
          </div>

          <Input
            label="This week, we'll try:"
            value={experiment}
            onChange={setExperiment}
            multiline
            rows={3}
            placeholder="One small, specific thing..." />

        </div>

        <div className="bg-[#F0F4F0] border-2 border-dashed border-[#8BA888] rounded-lg p-6 max-w-2xl mx-auto space-y-3">
          <p className="font-semibold text-[#3A3A3A]">The ritual loop:</p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            Come back in a month (or whenever shit feels off). Do this again.
            See what changed.
          </p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            That's how you build a relationship that doesn't erode—by checking
            in before you have to.
          </p>
        </div>

        <div className="text-center pt-4">
          {!canContinue &&
          <p className="text-sm text-[#8A8A8A] italic mb-3">
              Write at least 10 characters to continue
            </p>
          }
          <Button onClick={handleSave} disabled={!canContinue}>
            Create Your Card →
          </Button>
        </div>
      </div>
    </Screen>);

}