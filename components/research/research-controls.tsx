'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Square, TimerReset } from 'lucide-react';
import { toast } from 'sonner';

interface ResearchControlsProps {
  researchId: string;
  isActive: boolean;
  startTime?: string;
  timeLimit?: number; // in seconds
  onTerminated?: () => void;
}

export function ResearchControls({ 
  researchId, 
  isActive, 
  startTime,
  timeLimit = 270, // default 4.5 minutes (4.5 * 60 = 270)
  onTerminated 
}: ResearchControlsProps) {
  const [isTerminating, setIsTerminating] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);
  const [showExtendButton, setShowExtendButton] = useState(false);

  // Calculate and update time remaining
  useEffect(() => {
    if (!isActive || !startTime) return;

    const calculateTimeRemaining = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000); // seconds
      const remaining = Math.max(0, timeLimit - elapsed);
      
      setTimeRemaining(remaining);
      
      // Show extend button when less than 90 seconds remain
      setShowExtendButton(remaining < 90);
    };

    // Initial calculation
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, startTime, timeLimit]);

  // Handle termination request
  const handleTerminate = async () => {
    if (!researchId) return;
    
    setIsTerminating(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchId,
          action: 'terminate',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to terminate research');
      }

      toast.success('Research terminated', {
        description: 'Your research has been stopped. Results will be available shortly.',
      });
      
      if (onTerminated) onTerminated();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to terminate research. Please try again.',
      });
    } finally {
      setIsTerminating(false);
    }
  };

  // Handle timeout extension
  const handleExtend = async () => {
    if (!researchId) return;
    
    setIsExtending(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchId,
          action: 'extend_timeout',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend timeout');
      }

      toast.success('Timeout extended', {
        description: 'Research timeout has been extended by 5 minutes.',
      });
      
      // Update local time limit
      setTimeRemaining((prev: number) => prev + 300); // Add 5 minutes (300 seconds)
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to extend timeout. Please try again.',
      });
    } finally {
      setIsExtending(false);
    }
  };

  // Don't show controls if research is not active
  if (!isActive) return null;

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 mb-4 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <span>Research in progress</span>
          {timeRemaining > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              Time remaining: {formatTime(timeRemaining)}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTerminate}
            disabled={isTerminating}
          >
            <Square className="h-4 w-4 mr-1" />
            {isTerminating ? 'Stopping...' : 'Stop & Get Results'}
          </Button>
          {showExtendButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtend}
              disabled={isExtending}
            >
              <TimerReset className="h-4 w-4 mr-1" />
              {isExtending ? 'Extending...' : 'Need More Time'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
