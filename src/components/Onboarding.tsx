import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button, ButtonShimmer } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Progress } from './ui/progress';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { fadeInUp, slideInRight, transitions, easings } from '@/lib/animations';

interface OnboardingProps {
  userName: string;
  onComplete: (responses: Record<string, string>) => void;
}

const prompts = [
  {
    id: 'niche_interest',
    question: 'What\'s a niche interest you could talk about for an hour?',
    placeholder: 'Maybe vintage synthesizers, urban foraging, or the history of fonts...',
    type: 'textarea'
  },
  {
    id: 'project',
    question: 'What\'s a project or topic you\'re excited to explore this year?',
    placeholder: 'Learning a new language, starting a podcast, building something...',
    type: 'textarea'
  },
  {
    id: 'connection_type',
    question: 'What kind of connection are you open to right now?',
    type: 'radio',
    options: [
      'Make friends',
      'Share a hobby',
      'Swap ideas',
      'Professional peer'
    ]
  },
  {
    id: 'rabbit_hole',
    question: 'Optional fun: a recent rabbit hole or obsession.',
    placeholder: 'That thing you\'ve been researching at 2am...',
    type: 'textarea',
    optional: true
  },
  {
    id: 'preferences',
    question: 'Anything that would make a first chat easier?',
    placeholder: 'Time zone preferences, lunch walker, remote coffee enthusiast...',
    type: 'textarea',
    optional: true
  }
];

export default function Onboarding({ userName, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  const currentPrompt = prompts[currentStep];
  const progress = ((currentStep + 1) / prompts.length) * 100;

  const handleNext = () => {
    if (currentStep < prompts.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(responses);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = responses[currentPrompt.id]?.trim() || currentPrompt.optional;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-20">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.normal}
          className="mb-8 sm:mb-16 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 sm:gap-5">
            <IconBadge icon={Sprout} size="sm" className="sm:w-14 sm:h-14" />
            <div>
              <p className="text-sm sm:text-base text-muted-foreground/90">Welcome, {userName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 tracking-wide">Step {currentStep + 1} of {prompts.length}</p>
            </div>
          </div>
          <Progress value={progress} className="w-32 sm:w-48 h-2" />
        </motion.div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.4, ease: easings.premium }}
          >
            <GlassCard className="p-6 sm:p-12 lg:p-16">
              <div className="mb-8 sm:mb-12">
                <h2 className="mb-4 sm:mb-6">
                  {currentPrompt.question}
                </h2>
                {currentPrompt.optional && (
                  <p className="text-sm text-muted-foreground/70 tracking-wide uppercase text-[11px]">Optional — skip if you\'d like</p>
                )}
              </div>

              {currentPrompt.type === 'textarea' ? (
                <Textarea
                  value={responses[currentPrompt.id] || ''}
                  onChange={(e) => setResponses({ ...responses, [currentPrompt.id]: e.target.value })}
                  placeholder={currentPrompt.placeholder}
                  className="relative min-h-32 sm:min-h-40 rounded-2xl resize-none bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base"
                />
              ) : (
                <RadioGroup
                  value={responses[currentPrompt.id] || ''}
                  onValueChange={(value) => setResponses({ ...responses, [currentPrompt.id]: value })}
                  className="relative space-y-3 sm:space-y-4"
                >
                  {currentPrompt.options?.map((option, idx) => (
                    <motion.div
                      key={option}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, ...transitions.normal }}
                      className="flex items-center space-x-4 sm:space-x-5 p-4 sm:p-5 rounded-2xl hover:bg-accent/8 transition-all cursor-pointer border border-transparent hover:border-border/40 hover:shadow-md hover:shadow-secondary/5 group"
                    >
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="cursor-pointer flex-1 text-sm sm:text-base group-hover:text-foreground transition-colors">
                        {option}
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>
              )}
            </GlassCard>

            <div className="flex items-center justify-between mt-6 sm:mt-10">
              <Button
                onClick={handleBack}
                disabled={currentStep === 0}
                variant="ghost"
                className="disabled:opacity-30 h-12 sm:h-14 px-6 sm:px-8 rounded-2xl text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed}
                variant="premium"
                className="rounded-2xl h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base"
              >
                <span className="relative z-10 flex items-center">
                  {currentStep === prompts.length - 1 ? 'Complete' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                </span>
                <ButtonShimmer />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground/60 mt-12 tracking-wide leading-relaxed">
          Your answers help us find meaningful matches — they\'re never shared publicly
        </p>
      </div>
    </div>
  );
}
