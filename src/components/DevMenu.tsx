import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface DevMenuProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const SCREENS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'matching', label: 'Matching Animation' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'feedback', label: 'Feedback' },
];

export default function DevMenu({ currentScreen, onNavigate }: DevMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ESC key to close menu
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="
          fixed top-6 right-6 z-[9999]
          w-12 h-12 rounded-full
          backdrop-blur-xl bg-card/80 border border-border/60
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 active:scale-95
        "
        title="Developer Menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Menu panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[9998]"
            />

            {/* Menu content */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="
                fixed top-24 right-6 z-[9999]
                w-72 rounded-2xl
                backdrop-blur-xl bg-card/95 border border-border/60
                shadow-2xl overflow-hidden
              "
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/40">
                <h3 className="text-foreground tracking-wide">
                  Dev Navigation
                </h3>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.875rem' }}>
                  Jump to any screen
                </p>
              </div>

              {/* Screen buttons */}
              <div className="p-3 space-y-1.5">
                {SCREENS.map((screen, index) => {
                  const isActive = currentScreen === screen.id;
                  
                  return (
                    <motion.button
                      key={screen.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onNavigate(screen.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full px-4 py-3 rounded-xl
                        text-left transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-br from-secondary to-accent text-primary-foreground shadow-md' 
                          : 'bg-muted/40 text-foreground hover:bg-muted/70 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '0.9375rem' }}>
                          {screen.label}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-primary-foreground"
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer note */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/30">
                <p className="text-muted-foreground" style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-background/60 border border-border/40 font-mono" style={{ fontSize: '0.75rem' }}>ESC</kbd> to close
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
