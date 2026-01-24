import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
export interface SplitIntroProps {
  partner1: string;
  partner2: string;
  onStart: (firstPartner: 1 | 2) => void;
}
export function SplitIntro({ partner1, partner2, onStart }: SplitIntroProps) {
  const [firstPartner, setFirstPartner] = useState<1 | 2>(1);
  const first = firstPartner === 1 ? partner1 : partner2;
  const second = firstPartner === 1 ? partner2 : partner1;
  return (
    <Screen>
      <motion.div
        className="space-y-8"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}>

        <motion.div
          className="text-center space-y-4"
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

            Time to Split Up
          </h1>
          <p className="text-xl text-[#5A5A5A]">(Just for a Minute)</p>
        </motion.div>

        {/* Animated Illustration - People separating */}
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.3
          }}>

          <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto">
            {/* Person 1 walking away with coffee (moves left) */}
            <motion.g
              initial={{
                x: 70
              }}
              animate={{
                x: 0
              }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                ease: 'easeInOut'
              }}>

              <motion.circle
                cx="80"
                cy="80"
                r="25"
                fill="#8BA888"
                opacity="0.3"
                animate={{
                  y: [0, -3, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

              <motion.rect
                x="60"
                y="105"
                width="40"
                height="60"
                rx="20"
                fill="#8BA888"
                opacity="0.3"
                animate={{
                  y: [0, -2, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

              <motion.ellipse
                cx="50"
                cy="90"
                rx="10"
                ry="15"
                fill="#8B6F47"
                animate={{
                  y: [0, -2, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

            </motion.g>

            {/* Separation arrows */}
            <motion.g
              initial={{
                opacity: 0,
                scale: 0
              }}
              animate={{
                opacity: 0.3,
                scale: 1
              }}
              transition={{
                delay: 1,
                duration: 0.5
              }}>

              <path
                d="M 140 100 L 120 100"
                stroke="#8A8A8A"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,4" />

              <path
                d="M 125 95 L 120 100 L 125 105"
                stroke="#8A8A8A"
                strokeWidth="2"
                fill="none" />


              <path
                d="M 160 100 L 180 100"
                stroke="#8A8A8A"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,4" />

              <path
                d="M 175 95 L 180 100 L 175 105"
                stroke="#8A8A8A"
                strokeWidth="2"
                fill="none" />

            </motion.g>

            {/* Person 2 with phone (moves right) */}
            <motion.g
              initial={{
                x: -70
              }}
              animate={{
                x: 0
              }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                ease: 'easeInOut'
              }}>

              <motion.circle
                cx="220"
                cy="80"
                r="25"
                fill="#E07856"
                opacity="0.3"
                animate={{
                  y: [0, -3, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

              <motion.rect
                x="200"
                y="105"
                width="40"
                height="60"
                rx="20"
                fill="#E07856"
                opacity="0.3"
                animate={{
                  y: [0, -2, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

              <motion.rect
                x="230"
                y="95"
                width="20"
                height="30"
                rx="3"
                fill="#3A3A3A"
                animate={{
                  y: [0, -2, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5
                }} />

            </motion.g>
          </svg>
        </motion.div>

        <motion.p
          className="text-lg text-[#5A5A5A] text-center max-w-lg mx-auto leading-relaxed"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 1.5
          }}>

          For the next 10 minutes, you'll take turns answering 3 questions
          privately on this device.
        </motion.p>

        <motion.p
          className="text-lg text-[#5A5A5A] text-center max-w-lg mx-auto"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 1.7
          }}>

          Think of it like journaling—honest, not perfect.
        </motion.p>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <motion.div
          className="bg-[#F0F4F0] border-2 border-dashed border-[#8BA888] rounded-lg p-6 max-w-lg mx-auto space-y-4"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            delay: 1.9
          }}>

          <p className="text-lg font-semibold text-[#3A3A3A]">
            {first}, you're up first.
          </p>

          <p className="text-base text-[#5A5A5A]">
            {second}, this is your cue to:
          </p>

          <ul className="space-y-2 text-base text-[#5A5A5A]">
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Take a walk around the block</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Refresh your coffee</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>
                Do literally anything that's not looking over {first}'s shoulder
              </span>
            </li>
          </ul>

          <p className="text-sm text-[#8A8A8A] pt-2">
            We'll call you back in ~10 min.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 2.1
          }}>

          <Button onClick={() => onStart(firstPartner)}>{first} Start →</Button>
          <Button
            variant="secondary"
            onClick={() => setFirstPartner(firstPartner === 1 ? 2 : 1)}>

            Switch Order
          </Button>
        </motion.div>
      </motion.div>
    </Screen>);

}