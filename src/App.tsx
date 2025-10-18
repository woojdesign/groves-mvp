import { useState, useEffect } from 'react';
import Welcome from './components/Welcome';
import Onboarding from './components/Onboarding';
import MatchingAnimation from './components/MatchingAnimation';
import Dashboard from './components/Dashboard';
import Feedback from './components/Feedback';
import DevMenu from './components/DevMenu';

type AppState = 'welcome' | 'onboarding' | 'matching' | 'dashboard' | 'feedback';

interface UserProfile {
  email: string;
  name: string;
  responses: Record<string, string>;
}

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [showDevMenu, setShowDevMenu] = useState(true);

  const handleJoin = (email: string, name: string) => {
    setUserProfile({ email, name, responses: {} });
    setState('onboarding');
  };

  const handleOnboardingComplete = (responses: Record<string, string>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, responses });
      setState('matching');
    }
  };

  const handleMatchingComplete = () => {
    setState('dashboard');
  };

  const handleMatchAction = (match: any, action: 'accept' | 'pass') => {
    if (action === 'accept') {
      setCurrentMatch(match);
      setState('feedback');
    }
  };

  const handleFeedbackComplete = () => {
    setState('dashboard');
    setCurrentMatch(null);
  };

  const handleDevNavigate = (screen: string) => {
    // Ensure we have necessary data for each screen
    if (screen === 'onboarding' || screen === 'matching' || screen === 'dashboard') {
      if (!userProfile) {
        setUserProfile({ 
          email: 'dev@commonplace.app', 
          name: 'Dev User', 
          responses: {} 
        });
      }
    }
    
    if (screen === 'feedback') {
      if (!currentMatch) {
        setCurrentMatch({
          id: 1,
          name: 'Alex Chen',
          photo: null,
          matchScore: 92,
          sharedInterests: ['hiking', 'photography', 'sustainability']
        });
      }
    }
    
    setState(screen as AppState);
  };

  // Keyboard shortcut to toggle dev menu (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowDevMenu(prev => !prev);
      }
      // ESC to close dev menu handled in DevMenu component
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Developer Menu */}
      {showDevMenu && (
        <DevMenu 
          currentScreen={state} 
          onNavigate={handleDevNavigate}
        />
      )}

      {/* Premium gradient background with depth */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        
        {/* Floating gradient orbs with animation */}
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-br from-accent/[0.08] to-secondary/[0.06] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-secondary/[0.1] to-accent/[0.05] rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-accent/[0.05] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        
        {/* Radial gradient overlay for vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20" />
      </div>

      {state === 'welcome' && <Welcome onJoin={handleJoin} />}
      {state === 'onboarding' && userProfile && (
        <Onboarding 
          userName={userProfile.name} 
          onComplete={handleOnboardingComplete} 
        />
      )}
      {state === 'matching' && <MatchingAnimation onComplete={handleMatchingComplete} />}
      {state === 'dashboard' && userProfile && (
        <Dashboard 
          userName={userProfile.name} 
          onMatchAction={handleMatchAction}
        />
      )}
      {state === 'feedback' && currentMatch && (
        <Feedback 
          match={currentMatch} 
          onComplete={handleFeedbackComplete}
        />
      )}
    </div>
  );
}
