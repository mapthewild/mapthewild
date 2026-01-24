import React, { useState } from 'react';
import { Landing } from './pages/Landing';
import { NamesToMeet } from './pages/NamesToMeet';
import { RitualSetup } from './pages/RitualSetup';
import { SplitIntro } from './pages/SplitIntro';
import { WarmUpQuestions } from './pages/WarmUpQuestions';
import type { WarmUpAnswers } from './pages/WarmUpQuestions';
import { Handoff } from './pages/Handoff';
import { WelcomeBack } from './pages/WelcomeBack';
import { ValuesMirror } from './pages/ValuesMirror';
import { TheGap } from './pages/TheGap';
import { WeeklyExperiment } from './pages/WeeklyExperiment';
import { SaveSchedule } from './pages/SaveSchedule';
type Screen =
'landing' |
'names' |
'ritual-setup' |
'split-intro' |
'warmup-p1' |
'handoff-1' |
'warmup-p2' |
'welcome-back' |
'values-mirror' |
'the-gap' |
'weekly-experiment' |
'save-schedule';
interface AppState {
  partner1: string;
  partner2: string;
  appreciation1: string;
  appreciation2: string;
  customRitual?: string;
  firstPartner: 1 | 2;
  warmup1?: WarmUpAnswers;
  warmup2?: WarmUpAnswers;
  gapReflections?: {
    question1: string;
    question2: string;
  };
  weeklyExperiment?: string;
}
export function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [state, setState] = useState<AppState>({
    partner1: '',
    partner2: '',
    appreciation1: '',
    appreciation2: '',
    firstPartner: 1
  });
  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({
      ...prev,
      ...updates
    }));
  };
  const firstPartner =
  state.firstPartner === 1 ? state.partner1 : state.partner2;
  const secondPartner =
  state.firstPartner === 1 ? state.partner2 : state.partner1;
  return (
    <div className="min-h-screen">
      {screen === 'landing' && <Landing onStart={() => setScreen('names')} />}

      {screen === 'names' &&
      <NamesToMeet
        onContinue={(data) => {
          updateState(data);
          setScreen('ritual-setup');
        }} />

      }

      {screen === 'ritual-setup' &&
      <RitualSetup
        onReady={(customRitual) => {
          if (customRitual)
          updateState({
            customRitual
          });
          setScreen('split-intro');
        }} />

      }

      {screen === 'split-intro' &&
      <SplitIntro
        partner1={state.partner1}
        partner2={state.partner2}
        onStart={(firstPartner) => {
          updateState({
            firstPartner
          });
          setScreen('warmup-p1');
        }} />

      }

      {screen === 'warmup-p1' &&
      <WarmUpQuestions
        partnerName={firstPartner}
        otherPartnerName={secondPartner}
        onComplete={(answers) => {
          if (state.firstPartner === 1) {
            updateState({
              warmup1: answers
            });
          } else {
            updateState({
              warmup2: answers
            });
          }
          setScreen('handoff-1');
        }} />

      }

      {screen === 'handoff-1' &&
      <Handoff
        completedPartner={firstPartner}
        nextPartner={secondPartner}
        onContinue={() => setScreen('warmup-p2')} />

      }

      {screen === 'warmup-p2' &&
      <WarmUpQuestions
        partnerName={secondPartner}
        otherPartnerName={firstPartner}
        onComplete={(answers) => {
          if (state.firstPartner === 1) {
            updateState({
              warmup2: answers
            });
          } else {
            updateState({
              warmup1: answers
            });
          }
          setScreen('welcome-back');
        }} />

      }

      {screen === 'welcome-back' &&
      <WelcomeBack
        partner1={state.partner1}
        partner2={state.partner2}
        onContinue={() => setScreen('values-mirror')} />

      }

      {screen === 'values-mirror' && state.warmup1 && state.warmup2 &&
      <ValuesMirror
        partner1Name={state.partner1}
        partner2Name={state.partner2}
        partner1Answers={state.warmup1}
        partner2Answers={state.warmup2}
        onContinue={() => setScreen('the-gap')} />

      }

      {screen === 'the-gap' &&
      <TheGap
        partner1Name={state.partner1}
        partner2Name={state.partner2}
        onContinue={(reflections) => {
          updateState({
            gapReflections: reflections
          });
          setScreen('weekly-experiment');
        }} />

      }

      {screen === 'weekly-experiment' &&
      <WeeklyExperiment
        partner1Name={state.partner1}
        partner2Name={state.partner2}
        onComplete={(experiment) => {
          updateState({
            weeklyExperiment: experiment
          });
          setScreen('save-schedule');
        }} />

      }

      {screen === 'save-schedule' && state.warmup1 && state.warmup2 &&
      <SaveSchedule
        partner1={state.partner1}
        partner2={state.partner2}
        warmup1={state.warmup1}
        warmup2={state.warmup2}
        gapReflections={state.gapReflections}
        weeklyExperiment={state.weeklyExperiment} />

      }
    </div>);

}

export default App