import React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
export interface HandoffProps {
  completedPartner: string;
  nextPartner: string;
  onContinue: () => void;
}
export function Handoff({
  completedPartner,
  nextPartner,
  onContinue
}: HandoffProps) {
  return (
    <Screen>
      <motion.div
        className="space-y-8 text-center"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}>

        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#8BA888] to-[#6B9668]"
          initial={{
            scale: 0
          }}
          animate={{
            scale: 1
          }}
          transition={{
            type: 'spring',
            duration: 0.6,
            delay: 0.2
          }}>

          <motion.svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{
              pathLength: 0
            }}
            animate={{
              pathLength: 1
            }}
            transition={{
              duration: 0.5,
              delay: 0.5
            }}>

            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7" />

          </motion.svg>
        </motion.div>

        <motion.div
          className="space-y-2"
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

          <h1
            className="text-3xl md:text-4xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            Nice Work, {completedPartner}
          </h1>
          <p className="text-lg text-[#5A5A5A]">
            Your answers are saved and hidden.
          </p>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <motion.div
          className="my-6"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.4
          }}>

          <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto">
            <motion.g
              initial={{
                x: 0,
                opacity: 1
              }}
              animate={{
                x: -50,
                opacity: 0
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
                  ease: 'easeInOut'
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
                  ease: 'easeInOut'
                }} />

            </motion.g>

            <motion.g
              initial={{
                scale: 0.8,
                opacity: 0
              }}
              animate={{
                scale: 1,
                opacity: 1
              }}
              transition={{
                delay: 1,
                duration: 0.5
              }}>

              <rect
                x="120"
                y="90"
                width="60"
                height="40"
                rx="5"
                fill="#3A3A3A" />

              <rect x="125" y="95" width="50" height="30" fill="#FAF7F2" />
              <motion.circle
                cx="150"
                cy="110"
                r="3"
                fill="#8BA888"
                animate={{
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }} />

            </motion.g>

            <motion.g
              initial={{
                x: -20,
                opacity: 0
              }}
              animate={{
                x: 0,
                opacity: 1
              }}
              transition={{
                delay: 1.2,
                duration: 0.8
              }}>

              <path
                d="M 180 110 L 200 110"
                stroke="#E07856"
                strokeWidth="3"
                fill="none" />

              <path
                d="M 195 105 L 200 110 L 195 115"
                stroke="#E07856"
                strokeWidth="3"
                fill="none" />

            </motion.g>

            <motion.g
              initial={{
                x: 50,
                opacity: 0
              }}
              animate={{
                x: 0,
                opacity: 1
              }}
              transition={{
                duration: 1.5,
                delay: 1.5,
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
                  delay: 1.5
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
                  delay: 1.5
                }} />

            </motion.g>
          </svg>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 2.5
          }}>

          <h2
            className="text-2xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            Now Go Get {nextPartner}
          </h2>
          <p className="text-base text-[#5A5A5A]">Hand them the device.</p>
          <p className="text-base text-[#5A5A5A]">Then step away.</p>
          <p className="text-sm text-[#8A8A8A] italic">
            (Seriously, no peeking.)
          </p>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7] max-w-md mx-auto"></div>

        <motion.div
          className="pt-4"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 2.7
          }}>

          <Button onClick={onContinue}>{nextPartner}, I'm Ready →</Button>
          <p className="text-sm text-[#8A8A8A] mt-3">
            We'll tell you when to swap.
          </p>
        </motion.div>
      </motion.div>
    </Screen>);

}