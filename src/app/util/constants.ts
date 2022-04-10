export const date = '04/09/2022';

// Lenght of the word.
export const WORD_LENGTH = 5;

// Number of tries.
export const NUM_TRIES = 6;

// Letter map.
export const WAFFLE_EMOJI = '🧇';

export const targetWord = Array.from({ length: 5 }).fill(WAFFLE_EMOJI);

// One try.
export interface Try {
  letters: Letter[];
}

// One letter in a try.
export interface Letter {
  text: string;
  state: LetterState;
}

export enum LetterState {
  WRONG,
  PARTIAL_MATCH,
  FULL_MATCH,
  PENDING
}

export const keyboardRows = [
    ['🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇'],
    ['🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', ''],
    ['Enter', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', '🧇', 'Backspace'],
];

export const message = [
    'WAFFLE'
];
