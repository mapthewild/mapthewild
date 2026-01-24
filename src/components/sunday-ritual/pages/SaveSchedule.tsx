import React, { useState, createElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { WarmUpAnswers } from './WarmUpQuestions';
export interface SaveScheduleProps {
  partner1: string;
  partner2: string;
  warmup1: WarmUpAnswers;
  warmup2: WarmUpAnswers;
  gapReflections?: {
    question1: string;
    question2: string;
  };
  weeklyExperiment?: string;
}
export function SaveSchedule({
  partner1,
  partner2,
  warmup1,
  warmup2,
  gapReflections,
  weeklyExperiment
}: SaveScheduleProps) {
  const [showCopied, setShowCopied] = useState(false);
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const generatePlainText = () => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `☀️ SUNDAY RITUAL
${partner1} & ${partner2}
${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧭 WHAT YOU VALUE MOST

${partner1}:
${warmup1.valuesMost}

${partner2}:
${warmup2.valuesMost}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💛 RECENT CONNECTION MOMENTS

${partner1}:
${warmup1.showLove}

${partner2}:
${warmup2.showLove}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌅 YOUR VISION (ONE YEAR FROM NOW)

${partner1}:
${warmup1.goodLooksLike}

${partner2}:
${warmup2.goodLooksLike}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 THE GAP

What's working?
${gapReflections?.question1 || ''}

Where's the mismatch?
${gapReflections?.question2 || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 THIS WEEK'S EXPERIMENT

"${weeklyExperiment || ''}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Check-in: ${oneMonthFromNow.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}

☀️ sundayritual.com
`;
  };
  const handleDownload = () => {
    const content = generatePlainText();
    const blob = new Blob([content], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `ritual-${partner1.toLowerCase()}-${partner2.toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleCopy = async () => {
    const content = generatePlainText();
    await navigator.clipboard.writeText(content);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };
  const handleAddToCalendar = () => {
    const event = {
      title: 'Sunday Ritual - Monthly Check-in',
      description: `Time for ${partner1} and ${partner2} to do the Sunday Morning Ritual again. See what changed.`,
      start: oneMonthFromNow.toISOString(),
      duration: 30
    };
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sunday Ritual//Ritual//EN
BEGIN:VEVENT
DTSTART:${oneMonthFromNow.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DURATION:PT30M
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], {
      type: 'text/calendar'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sunday-ritual-checkin.ics';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Screen>
      <motion.div
        className="space-y-8 max-w-lg mx-auto"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
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

            Before You Go
          </h1>

          <p className="text-lg text-[#5A5A5A] leading-relaxed">
            The most important conversation is sometimes an expensive one.
          </p>
          <p className="text-lg text-[#5A5A5A] font-medium">You just had it.</p>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7]"></div>

        <motion.div
          className="space-y-6"
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

          {/* Download/Copy Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-4">
              SAVE YOUR RITUAL
            </h2>

            <p className="text-base text-[#5A5A5A] mb-4">
              Download all your responses as a text file. Keep it in your notes,
              share it with each other, or revisit it next month.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleCopy}>Copy to Clipboard →</Button>
              <Button variant="secondary" onClick={handleDownload}>
                Download as Text
              </Button>
            </div>

            <AnimatePresence>
              {showCopied &&
              <motion.p
                className="text-sm text-[#8BA888] mt-3 flex items-center gap-2"
                initial={{
                  opacity: 0,
                  y: -10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0
                }}>

                  <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">

                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7" />

                  </svg>
                  Copied! Paste into Apple Notes, Notion, or any text editor
                </motion.p>
              }
            </AnimatePresence>

            <p className="text-xs text-[#8A8A8A] italic mt-3">
              Works in Apple Notes, Google Docs, Notion, or any text editor
            </p>
          </div>

          <div className="w-full h-0.5 bg-[#E8D5B7]"></div>

          {/* Calendar Invite */}
          <div>
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-3">
              COME BACK
            </h2>
            <p className="text-base text-[#5A5A5A] mb-4">
              Schedule your next check-in. We recommend 1 month. See what
              changed.
            </p>

            <div className="space-y-3">
              <div className="bg-[#FFFEF8] border-2 border-[#E8D5B7] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-[#3A3A3A]">
                      Next Check-in
                    </p>
                    <p className="text-sm text-[#5A5A5A]">
                      {oneMonthFromNow.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-[#8A8A8A] mt-1">
                      30 minutes · Sunday morning recommended
                    </p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              <Button onClick={handleAddToCalendar}>Add to Calendar →</Button>

              <p className="text-xs text-[#8A8A8A] italic">
                Downloads a calendar file (.ics) that works with Google
                Calendar, Apple Calendar, Outlook, etc.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="w-full h-0.5 bg-[#E8D5B7]"></div>

        <motion.div
          className="text-center"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.4
          }}>

          <p className="text-sm text-[#5A5A5A] italic mb-4">
            That's how you build a relationship that doesn't erode—by checking
            in before you have to.
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Start New Ritual
          </Button>
        </motion.div>
      </motion.div>
    </Screen>);

}