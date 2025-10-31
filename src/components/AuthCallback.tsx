/**
 * Auth Callback Component
 *
 * Handles magic link verification and redirects user based on onboarding status
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Mail } from 'lucide-react';
import { verifyToken } from '../lib/apiService';
import { LoadingSpinner } from './ui/loading-spinner';
import { ErrorMessage } from './ui/error-message';
import { GlassCard } from './ui/glass-card';
import { IconBadge } from './ui/icon-badge';
import { scaleIn, transitions } from '../lib/animations';
import type { ApiError } from '../types/api';

type VerificationState = 'verifying' | 'success' | 'error';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState<ApiError | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setState('error');
      setError({
        statusCode: 400,
        message: 'Invalid or missing verification token',
        error: 'Bad Request',
      });
      return;
    }

    verifyMagicLink(token);
  }, [searchParams]);

  const verifyMagicLink = async (token: string) => {
    try {
      setState('verifying');

      const response = await verifyToken(token);
      const { user } = response;

      setUserName(user.name);
      setState('success');

      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        if (user.hasCompletedOnboarding) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }, 1500);
    } catch (err) {
      console.error('Token verification failed:', err);
      setState('error');
      setError(err as ApiError);
    }
  };

  const handleRetry = () => {
    const token = searchParams.get('token');
    if (token) {
      verifyMagicLink(token);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.normal}
        className="w-full max-w-lg"
      >
        {state === 'verifying' && (
          <GlassCard variant="premium" withGlow={false} className="p-12 text-center">
            <LoadingSpinner size="lg" message="Verifying your magic link..." />
          </GlassCard>
        )}

        {state === 'success' && (
          <motion.div {...scaleIn} transition={{ delay: 0.2, ...transitions.normal }}>
            <GlassCard variant="premium" withGlow={false} className="p-12 text-center">
              <IconBadge icon={CheckCircle} size="lg" className="inline-flex mb-6 bg-secondary/15 text-secondary" />
              <p className="mb-3 text-lg">{userName ? `Welcome back, ${userName}!` : 'Welcome!'}</p>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                Redirecting you now...
              </p>
            </GlassCard>
          </motion.div>
        )}

        {state === 'error' && error && (
          <ErrorMessage
            error={error}
            title="Verification failed"
            onRetry={handleRetry}
          />
        )}

        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground/70 mb-4">
              Your magic link may have expired or is invalid.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-secondary hover:text-secondary/80 transition-colors underline"
            >
              Request a new magic link
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
