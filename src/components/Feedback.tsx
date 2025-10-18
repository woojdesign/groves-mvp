import { useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button, ButtonShimmer } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { fadeInUp, scaleIn, transitions, easings } from '@/lib/animations';

interface FeedbackProps {
  match: {
    name: string;
  };
  onComplete: () => void;
}

export default function Feedback({ match, onComplete }: FeedbackProps) {
  const [didMeet, setDidMeet] = useState<string>('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const canSubmit = didMeet !== '';

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <motion.div
          {...scaleIn}
          transition={transitions.normal}
          className="text-center"
        >
          <IconBadge icon={Sprout} size="lg" className="inline-flex w-24 h-24 mb-10" />
          <h2 className="mb-6">Thank you</h2>
          <p className="max-w-md mx-auto text-muted-foreground/80 leading-relaxed text-lg">
            Your feedback helps us create better matches for everyone
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        {...fadeInUp}
        transition={transitions.slow}
        className="w-full max-w-3xl"
      >
        <div className="mb-16 flex items-center gap-5">
          <IconBadge icon={Sprout} size="md" />
          <div>
            <p className="text-base text-muted-foreground/90">Quick check-in</p>
            <p className="text-sm text-muted-foreground/60 mt-1 tracking-wide">This helps us learn</p>
          </div>
        </div>

        <GlassCard className="p-16">
          <div className="space-y-12">
            {/* Did you meet? */}
            <div>
              <Label className="mb-6 block text-foreground/90 text-base">
                Did you connect with {match.name}?
              </Label>
              <RadioGroup value={didMeet} onValueChange={setDidMeet} className="space-y-4">
                <div className="flex items-center space-x-5 p-5 rounded-2xl hover:bg-accent/8 transition-all cursor-pointer border border-transparent hover:border-border/40 hover:shadow-md hover:shadow-secondary/5 group">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer flex-1 text-base group-hover:text-foreground transition-colors">
                    Yes, we met
                  </Label>
                </div>
                <div className="flex items-center space-x-5 p-5 rounded-2xl hover:bg-accent/8 transition-all cursor-pointer border border-transparent hover:border-border/40 hover:shadow-md hover:shadow-secondary/5 group">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="cursor-pointer flex-1 text-base group-hover:text-foreground transition-colors">
                    Not yet, but it\'s scheduled
                  </Label>
                </div>
                <div className="flex items-center space-x-5 p-5 rounded-2xl hover:bg-accent/8 transition-all cursor-pointer border border-transparent hover:border-border/40 hover:shadow-md hover:shadow-secondary/5 group">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="cursor-pointer flex-1 text-base group-hover:text-foreground transition-colors">
                    No, it didn\'t work out
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Helpful? */}
            {didMeet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.normal}
              >
                <Label className="mb-6 block text-foreground/90 text-base">
                  Was this introduction helpful?
                </Label>
                <div className="flex gap-5">
                  <Button
                    type="button"
                    variant={helpful === true ? 'default' : 'outline'}
                    onClick={() => setHelpful(true)}
                    className={`flex-1 rounded-2xl h-14 text-base transition-all duration-300 ${
                      helpful === true
                        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20'
                        : 'border-border/50 hover:border-border hover:bg-accent/8 hover:shadow-lg'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={helpful === false ? 'default' : 'outline'}
                    onClick={() => setHelpful(false)}
                    className={`flex-1 rounded-2xl h-14 text-base transition-all duration-300 ${
                      helpful === false
                        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/20'
                        : 'border-border/50 hover:border-border hover:bg-accent/8 hover:shadow-lg'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Not really
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Optional note */}
            {helpful !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.normal}
              >
                <Label className="mb-5 block flex items-center gap-2 text-foreground/90 text-base">
                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                  Anything else? (optional)
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What worked well or what could be better..."
                  className="min-h-32 rounded-2xl resize-none bg-background/60 backdrop-blur-sm border-border/40 hover:border-border/70 focus:border-secondary/50 focus:ring-4 focus:ring-secondary/10 transition-all text-base"
                />
              </motion.div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant="premium"
            className="w-full mt-12 rounded-2xl h-16 text-base"
          >
            <span className="relative z-10">Submit feedback</span>
            <ButtonShimmer />
          </Button>
        </GlassCard>

        <p className="text-center text-xs text-muted-foreground/60 mt-16 tracking-wide leading-relaxed">
          Your responses help us create better matches
        </p>
      </motion.div>
    </div>
  );
}
