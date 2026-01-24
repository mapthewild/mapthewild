import React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
export interface LandingProps {
  onStart: () => void;
}
export function Landing({ onStart }: LandingProps) {
  return (
    <Screen>
      <motion.div
        className="text-center space-y-8"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          duration: 0.6
        }}>

        {/* Logo */}
        <motion.div
          className="text-2xl font-bold text-[#3A3A3A]"
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}>

          ☀️ Sunday Ritual
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="my-8 max-w-2xl mx-auto"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            delay: 0.3,
            duration: 0.5
          }}>

          <img
            src="/Gemini_Generated_Image_t034fkt034fkt034.png"
            alt="Therapy without the waiting room"
            className="w-full rounded-2xl shadow-lg" />

        </motion.div>

        {/* Headline */}
        <motion.div
          className="space-y-4"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.4
          }}>

          <h1
            className="text-4xl md:text-5xl font-serif text-[#3A3A3A] leading-tight"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            The Sunday Morning Ritual
          </h1>
          <div className="w-32 h-0.5 bg-[#E07856] mx-auto"></div>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="text-xl text-[#5A5A5A] leading-relaxed max-w-lg mx-auto"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.5
          }}>

          Build your relationship manual together.
        </motion.p>

        {/* Why a ritual */}
        <motion.div
          className="max-w-2xl mx-auto space-y-6 pt-4"
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.6
          }}>

          <h2
            className="text-2xl font-serif text-[#3A3A3A]"
            style={{
              fontFamily: 'Libre Baskerville, serif'
            }}>

            Why a ritual?
          </h2>

          <div className="space-y-4 text-base text-[#5A5A5A] leading-relaxed">
            <p>
              Most couples know what they value. They just forget to check if
              they're actually living it.
            </p>

            <p>
              This ritual gives you 30 minutes to get back on the same
              page—before life, work, and Netflix push you further apart.
            </p>

            <p>
              <strong>What you'll do:</strong> Answer a few questions separately
              (honest, not perfect), then come back together to talk through
              what you built.
            </p>

            <p className="text-sm text-[#8A8A8A] italic">
              Think of it as preventive maintenance. Way cheaper than therapy.
              Way more effective than hoping things get better on their own.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="pt-4"
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

          <Button onClick={onStart} className="text-lg">
            Start the Ritual →
          </Button>
          <p className="text-sm text-[#8A8A8A] mt-3">
            ~30 minutes · Coffee recommended
          </p>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-sm italic text-[#8A8A8A] max-w-md mx-auto pt-8"
          style={{
            fontFamily: 'Georgia, serif'
          }}
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.8
          }}>

          "Not therapy. Not a quiz. Just a structured way to remember why you're
          doing this."
        </motion.p>
      </motion.div>
    </Screen>);

}