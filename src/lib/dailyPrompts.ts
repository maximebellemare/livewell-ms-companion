/* Shared daily prompt logic — used by DailyPromptCard and ThisWeekInReflection */

export const PROMPTS = [
  "What helped you most today?",
  "What's one small thing you're grateful for right now?",
  "How did your body feel when you first woke up this morning?",
  "What did you do today to be kind to yourself?",
  "What's one moment from today you'd like to remember?",
  "What drained your energy most today, and what restored it?",
  "Did anything surprise you about how you felt today?",
  "What would make tomorrow feel a little easier?",
  "What are you holding on to that you could let go of today?",
  "Who or what gave you comfort today?",
  "What does your body need most right now?",
  "What's one thing you managed today despite how you were feeling?",
  "If you could tell your future self something about today, what would it be?",
  "What felt hard today — and how did you handle it?",
  "What are you proud of doing for yourself this week?",
  "Is there anything you've been avoiding thinking about?",
  "What small joy showed up unexpectedly today?",
  "How did you connect with others today, or did you need solitude?",
  "What does 'a good day' look like for you right now?",
  "What's one thing you want to do more of this week?",
];

/** Returns the day-of-year (1-based) for a given Date */
function dayOfYear(date: Date): number {
  return Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
}

/** Returns the rotating prompt for a specific date */
export function getPromptForDate(date: Date): string {
  return PROMPTS[dayOfYear(date) % PROMPTS.length];
}

/** Returns today's prompt and its index in the array */
export function getDailyPrompt(): { prompt: string; index: number } {
  const today = new Date();
  const index = dayOfYear(today) % PROMPTS.length;
  return { prompt: PROMPTS[index], index };
}
