// Lenght of the word.
export const WORD_LENGTH = 6;

// Number of tries.
export const NUM_TRIES = 6;

// Letter map.
export const LETTERS = (() => {
  // letter -> true. Easier to check.
  const ret: {[key: string]: boolean} = {};
  for (let charCode = 97; charCode < 97 + 26; charCode++) {
    ret[String.fromCharCode(charCode)] = true;
  }
  return ret;
})();

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
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ''],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
];

export const winMessages = [
    'Wow. You\'re so smart.',
    'Sweet Mother Mary.',
    'OMG!',
    'You\'re pretty good at this.',
    'Look at you go!',
    'Huh. Look at that.',
    'A real Albert Einstein.',
    'Wowzers.',
    'Amazeballs.',
    'You could do this for a living.',
    'Who would\'ve guessed?',
    'Impressive.',
    'Truly magnificent.',
    'You are a genius.',
    'Knew you had it in ya.',
    'No way!',
    'Jeez Louise!',
    'You\'re wicked smaht.',
    'Elementary, my dear.'
];

export const loseMessages = [
    'Yikes.',
    'Better luck next time.',
    'Really dropped the ball there.',
    'Ouch.',
    'Hmmm. . .',
    'Too hard?',
    'Insert a quarter to try again.',
    'Should have read the instructions.',
    '*Insert insult here*',
    'Stay in school.',
    'Sheesh.',
    '6 letters is too many for you?',
    'What an idiot.',
    'R.I.P.',
    '*Dying cartoon noises*'
];