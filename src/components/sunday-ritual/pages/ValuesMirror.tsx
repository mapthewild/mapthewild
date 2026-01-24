import React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { WarmUpAnswers } from './WarmUpQuestions';
export interface ValuesMirrorProps {
  partner1Name: string;
  partner2Name: string;
  partner1Answers: WarmUpAnswers;
  partner2Answers: WarmUpAnswers;
  onContinue: () => void;
}
export function ValuesMirror({
  partner1Name,
  partner2Name,
  partner1Answers,
  partner2Answers,
  onContinue
}: ValuesMirrorProps) {
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

            Here's What You Each Said
          </h1>
          <p className="text-lg text-[#5A5A5A]">
            Read silently first. Then talk.
          </p>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-2xl mx-auto"></div>

        {/* Question 1: Values */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.3
          }}>

          <h3
            className="text-xl font-serif text-[#3A3A3A] text-center"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            🧭 What You Value Most
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              className="bg-[#FFFEF8] border-l-4 border-[#8BA888] rounded-lg p-5 space-y-2"
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

              <div className="text-sm font-semibold text-[#8BA888] uppercase tracking-wide">
                {partner1Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner1Answers.valuesMost}
              </p>
            </motion.div>

            <motion.div
              className="bg-[#FFFEF8] border-l-4 border-[#E07856] rounded-lg p-5 space-y-2"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.4
              }}>

              <div className="text-sm font-semibold text-[#E07856] uppercase tracking-wide">
                {partner2Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner2Answers.valuesMost}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Question 2: Connection Moments */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.5
          }}>

          <h3
            className="text-xl font-serif text-[#3A3A3A] text-center"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            💛 Recent Connection Moments
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              className="bg-[#FFFEF5] border-l-4 border-[#8BA888] rounded-lg p-5 space-y-2"
              initial={{
                opacity: 0,
                x: -20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.6
              }}>

              <div className="text-sm font-semibold text-[#8BA888] uppercase tracking-wide">
                {partner1Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner1Answers.showLove}
              </p>
            </motion.div>

            <motion.div
              className="bg-[#FFFEF5] border-l-4 border-[#E07856] rounded-lg p-5 space-y-2"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.6
              }}>

              <div className="text-sm font-semibold text-[#E07856] uppercase tracking-wide">
                {partner2Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner2Answers.showLove}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Question 3: Vision */}
        <motion.div
          className="space-y-4 max-w-3xl mx-auto"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.7
          }}>

          <h3
            className="text-xl font-serif text-[#3A3A3A] text-center"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            🌅 Your Vision (One Year From Now)
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              className="bg-[#FFF5F2] border-l-4 border-[#8BA888] rounded-lg p-5 space-y-2"
              initial={{
                opacity: 0,
                x: -20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.8
              }}>

              <div className="text-sm font-semibold text-[#8BA888] uppercase tracking-wide">
                {partner1Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner1Answers.goodLooksLike}
              </p>
            </motion.div>

            <motion.div
              className="bg-[#FFF5F2] border-l-4 border-[#E07856] rounded-lg p-5 space-y-2"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              transition={{
                delay: 0.8
              }}>

              <div className="text-sm font-semibold text-[#E07856] uppercase tracking-wide">
                {partner2Name}
              </div>
              <p className="text-base text-[#3A3A3A] leading-relaxed">
                {partner2Answers.goodLooksLike}
              </p>
            </motion.div>
          </div>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-2xl mx-auto"></div>

        {/* Conversation Prompts */}
        <motion.div
          className="bg-[#F0F4F0] border-2 border-dashed border-[#8BA888] rounded-lg p-6 max-w-2xl mx-auto space-y-4"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            delay: 0.9
          }}>

          <p className="font-semibold text-[#3A3A3A]">Talk about:</p>
          <ul className="space-y-3 text-[#5A5A5A]">
            <li className="flex items-start gap-3">
              <span className="text-[#8BA888] font-bold">→</span>
              <span>What surprised you?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#8BA888] font-bold">→</span>
              <span>Where do you overlap?</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#8BA888] font-bold">→</span>
              <span>Where are you different—and is that okay?</span>
            </li>
          </ul>
          <p className="text-sm text-[#8A8A8A] italic pt-2">
            Take 5 minutes. No typing. Just talk.
          </p>
        </motion.div>

        <motion.div
          className="text-center pt-4"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 1.0
          }}>

          <Button onClick={onContinue}>Continue →</Button>
        </motion.div>
      </motion.div>
    </Screen>);

}