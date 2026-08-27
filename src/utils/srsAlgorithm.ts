import { Flashcard } from '../types';

export interface SrsGradingResult {
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
}

/**
 * Calculates next interval, ease factor, and repetitions for a flashcard.
 * 
 * Anki SM-2 Spaced Repetition Rules:
 * - 'again': Complete lapse. Repetitions reset to 0, interval resets to 1 day, ease factor penalized by -0.20 (min 1.3).
 * - 'hard': Recall with difficulty. Repetitions increment, interval applies modest 1.2x growth (does not reset), ease factor lowered by -0.15 (min 1.3).
 * - 'good': Successful recall. Repetitions increment. Standard SM-2 intervals (1d -> 6d -> interval * easeFactor), ease factor unchanged.
 * - 'easy': Instant recall. Repetitions increment. Interval boosted (4d -> 8d -> interval * easeFactor * 1.3), ease factor rewarded with +0.15.
 */
export function calculateNextReview(
  card: Pick<Flashcard, 'interval' | 'easeFactor' | 'repetitions'>,
  quality: 'again' | 'hard' | 'good' | 'easy'
): SrsGradingResult {
  let { interval, easeFactor, repetitions } = card;

  // Ensure reasonable baseline defaults if card was newly created
  easeFactor = easeFactor || 2.5;
  repetitions = repetitions || 0;
  interval = interval || 1;

  if (quality === 'again') {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.20).toFixed(2)));
  } else if (quality === 'hard') {
    if (repetitions === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    repetitions += 1;
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
  } else if (quality === 'good') {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * easeFactor));
    }
    repetitions += 1;
    // Ease factor is unchanged on 'good'
    easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));
  } else if (quality === 'easy') {
    if (repetitions === 0) {
      interval = 4;
    } else if (repetitions === 1) {
      interval = Math.round(6 * 1.3); // 8 days
    } else {
      interval = Math.max(2, Math.round(interval * easeFactor * 1.3));
    }
    repetitions += 1;
    easeFactor = Math.max(1.3, Number((easeFactor + 0.15).toFixed(2)));
  }

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: nextDueDate.toISOString(),
    state: repetitions >= 4 ? 'mastered' : 'review',
  };
}

/**
 * Returns the projected interval (in days) for UI preview labels.
 */
export function getPreviewInterval(
  card: Pick<Flashcard, 'interval' | 'easeFactor' | 'repetitions'>,
  quality: 'again' | 'hard' | 'good' | 'easy'
): number {
  return calculateNextReview(card, quality).interval;
}
