import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Progress } from '../components/ui/progress';
import { GlassCard } from '../components/ui/glass-card';
import { IconBadge } from '../components/ui/icon-badge';
import { fadeInUp, slideInRight, transitions, easings } from '../lib/animations';

const prompts = [
  {
    id: 'niche_interest',
    question: 'What\'s a niche interest you could talk about for an hour?',
    placeholder: 'Maybe vintage synthesizers, urban foraging, or the history of fonts...',
    type: 'textarea',
    sampleResponse: 'I\'m fascinated by vintage synthesizers, especially the analog warmth of the Moog modulars from the 70s. There\'s something magical about patching cables and sculpting sound waves.'
  },
  {
    id: 'project',
    question: 'What\'s a project or topic you\'re excited to explore this year?',
    placeholder: 'Learning a new language, starting a podcast, building something...',
    type: 'textarea',
    sampleResponse: 'I\'ve been wanting to start a podcast about local coffee roasters and the stories behind small batch brewing. Each episode would feature a different roaster\'s journey.'
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
    ],
    selectedOption: 1 // "Share a hobby"
  },
  {
    id: 'rabbit_hole',
    question: 'Optional fun: a recent rabbit hole or obsession.',
    placeholder: 'That thing you\'ve been researching at 2am...',
    type: 'textarea',
    sampleResponse: 'I fell down a rabbit hole learning about mushroom foraging and mycology. Started with a nature walk and now I\'m growing oyster mushrooms in my kitchen!'
  }
];

export default function ShowcaseListen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  const currentPrompt = prompts[currentStep];
  const progress = ((currentStep + 1) / prompts.length) * 100;

  // Calculate typing duration based on text length
  const getTypingDuration = () => {
    if (currentPrompt.type === 'textarea' && currentPrompt.sampleResponse) {
      const charCount = currentPrompt.sampleResponse.length;
      return 500 + (charCount * 60) + 2000; // start delay + typing time + pause to read
    }
    return 3000; // For radio buttons
  };

  // Reset all states when step changes
  useEffect(() => {
    // Immediately clear states on step change
    setDisplayedText('');
    setSelectedOption(null);
    setIsTyping(false);
    setTypingComplete(false);
  }, [currentStep]);

  // Auto-cycle through questions - wait for typing to complete
  useEffect(() => {
    const duration = getTypingDuration();
    const timer = setTimeout(() => {
      setTypingComplete(true);
      setCurrentStep((prev) => (prev + 1) % prompts.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Typing animation for textarea responses
  useEffect(() => {
    if (currentPrompt.type === 'textarea' && currentPrompt.sampleResponse) {
      setIsTyping(true);
      let typeInterval: NodeJS.Timeout | null = null;

      // Wait 500ms before starting to type
      const startDelay = setTimeout(() => {
        let index = 0;
        const fullText = currentPrompt.sampleResponse || '';

        typeInterval = setInterval(() => {
          if (index < fullText.length) {
            setDisplayedText(fullText.slice(0, index + 1));
            index++;
          } else {
            setIsTyping(false);
            if (typeInterval) clearInterval(typeInterval);
          }
        }, 60); // 60ms per character for natural typing speed
      }, 500);

      return () => {
        clearTimeout(startDelay);
        if (typeInterval) clearInterval(typeInterval);
      };
    }
  }, [currentPrompt, currentStep]);

  // Auto-select radio option animation
  useEffect(() => {
    if (currentPrompt.type === 'radio' && currentPrompt.selectedOption !== undefined) {
      setSelectedOption(null);

      // Wait 800ms then select the option
      const selectTimer = setTimeout(() => {
        setSelectedOption(currentPrompt.selectedOption!);
      }, 800);

      return () => clearTimeout(selectTimer);
    }
  }, [currentPrompt, currentStep]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-20">
      {/* Premium gradient background with depth */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />

        {/* Floating gradient orbs with animation */}
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-br from-accent/[0.08] to-secondary/[0.06] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-secondary/[0.1] to-accent/[0.05] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

        {/* Radial gradient overlay for vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20" />
      </div>

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
              <p className="text-sm sm:text-base text-muted-foreground/90">Onboarding Preview</p>
              <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 tracking-wide">Step {currentStep + 1} of {prompts.length}</p>
            </div>
          </div>
          <Progress value={progress} className="w-32 sm:w-48 h-2" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: easings.premium }}
          >
            <GlassCard className="p-6 sm:p-12 lg:p-16">
              <div className="mb-8 sm:mb-12">
                <h2 className="mb-4 sm:mb-6">
                  {currentPrompt.question}
                </h2>
              </div>

              {currentPrompt.type === 'textarea' ? (
                <div key={currentPrompt.id} className="relative">
                  <Textarea
                    key={`textarea-${currentPrompt.id}`}
                    value={displayedText}
                    placeholder={currentPrompt.placeholder}
                    readOnly
                    className="relative min-h-32 sm:min-h-40 rounded-2xl resize-none bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base leading-relaxed"
                    style={{ fontFamily: 'inherit' }}
                  />
                  {/* Blinking cursor - positioned after the text */}
                  {isTyping && displayedText && (
                    <motion.div
                      className="absolute pointer-events-none"
                      style={{
                        left: '1rem',
                        top: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        maxWidth: 'calc(100% - 2rem)',
                        lineHeight: '1.625',
                        fontSize: '1rem'
                      }}
                    >
                      <span style={{ visibility: 'hidden' }}>{displayedText}</span>
                      <motion.span
                        className="text-foreground"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    </motion.div>
                  )}
                </div>
              ) : (
                <RadioGroup
                  value={selectedOption !== null ? currentPrompt.options![selectedOption] : ''}
                  className="relative space-y-3 sm:space-y-4"
                >
                  {currentPrompt.options?.map((option, idx) => (
                    <motion.div
                      key={option}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: selectedOption === idx ? 1.02 : 1
                      }}
                      transition={{
                        delay: idx * 0.1,
                        ...transitions.normal,
                        scale: { duration: 0.3 }
                      }}
                      className={`flex items-center space-x-4 sm:space-x-5 p-4 sm:p-5 rounded-2xl transition-all cursor-pointer border ${
                        selectedOption === idx
                          ? 'bg-accent/15 border-secondary/40 shadow-lg shadow-secondary/10'
                          : 'hover:bg-accent/8 border-transparent hover:border-border/40 hover:shadow-md hover:shadow-secondary/5'
                      } group`}
                    >
                      <RadioGroupItem value={option} id={option} checked={selectedOption === idx} />
                      <Label htmlFor={option} className="cursor-pointer flex-1 text-sm sm:text-base group-hover:text-foreground transition-colors">
                        {option}
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground/60 mt-12 tracking-wide leading-relaxed">
          Your answers help us find meaningful matches — they're never shared publicly
        </p>
      </div>
    </div>
  );
}
