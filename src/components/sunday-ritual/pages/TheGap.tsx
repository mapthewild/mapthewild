import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
export interface TheGapProps {
  partner1Name: string;
  partner2Name: string;
  onContinue: (reflections: {question1: string;question2: string;}) => void;
}
export function TheGap({
  partner1Name,
  partner2Name,
  onContinue
}: TheGapProps) {
  const [reflections, setReflections] = useState({
    question1: '',
    question2: ''
  });
  const updateReflection = (key: 'question1' | 'question2', value: string) => {
    setReflections((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const canContinue =
  reflections.question1.length > 10 && reflections.question2.length > 10;
  return (
    <Screen>
      <motion.div
        className="space-y-8"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          duration: 0.5
        }}>

        <motion.div
          className="text-center space-y-3"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}>

          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            One More Layer
          </h1>
          <p className="text-lg text-[#5A5A5A]">
            Connecting what you said to what you're living.
          </p>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-2xl mx-auto"></div>

        <motion.div
          className="bg-[#FFFEF8] border-l-4 border-[#F4C430] rounded-lg p-6 max-w-2xl mx-auto space-y-3"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            delay: 0.3
          }}>

          <p className="text-base text-[#5A5A5A] leading-relaxed">
            Based on what you both shared, here are two questions to explore
            together.
          </p>
          <p className="text-base text-[#5A5A5A] leading-relaxed">
            Talk it through first, then capture the key insights below. You both
            need to agree on what you write.
          </p>
        </motion.div>

        <div className="space-y-8 max-w-2xl mx-auto">
          {/* Question 1 */}
          <motion.div
            className="bg-[#FFFEF8] border-l-8 border-[#8BA888] rounded-lg p-6 space-y-4"
            initial={{
              opacity: 0,
              x: -20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: 0.4
            }}>

            <h3
              className="text-xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

              Question 1
            </h3>

            <p className="text-base text-[#5A5A5A] leading-relaxed italic">
              "Looking at what you both value and the moments you
              described—what's working? What's creating those good moments?"
            </p>

            <Input
              label="Your shared reflection:"
              value={reflections.question1}
              onChange={(val) => updateReflection('question1', val)}
              multiline
              rows={4}
              placeholder="Talk it through, then capture the key insight here..." />

          </motion.div>

          {/* Question 2 */}
          <motion.div
            className="bg-[#FFF5F2] border-l-8 border-[#E07856] rounded-lg p-6 space-y-4"
            initial={{
              opacity: 0,
              x: 20
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: 0.5
            }}>

            <h3
              className="text-xl font-serif text-[#3A3A3A]"
              style={{
                fontFamily: 'Libre Baskerville, serif'
              }}>

              Question 2
            </h3>

            <p className="text-base text-[#5A5A5A] leading-relaxed italic">
              "Where's the mismatch? What do you say you value that isn't
              showing up in your day-to-day?"
            </p>

            <p className="text-sm text-[#8A8A8A] italic">
              (This isn't about blame. It's about noticing where life got in the
              way of intention.)
            </p>

            <Input
              label="Your shared reflection:"
              value={reflections.question2}
              onChange={(val) => updateReflection('question2', val)}
              multiline
              rows={4}
              placeholder="Be honest. What's the gap?" />

          </motion.div>
        </div>

        <motion.div
          className="text-center pt-4 space-y-3"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.6
          }}>

          {!canContinue &&
          <p className="text-sm text-[#8A8A8A] italic">
              Fill in both reflections to continue (talk first, then write)
            </p>
          }
          <Button
            onClick={() => onContinue(reflections)}
            disabled={!canContinue}>

            Continue to Your Experiment →
          </Button>
        </motion.div>
      </motion.div>
    </Screen>);

}