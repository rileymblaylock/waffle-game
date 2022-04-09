import {Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren} from '@angular/core';
import { wordsList } from '../util/wordsList';
import { Try, LetterState, NUM_TRIES, Letter, WORD_LENGTH, LETTERS, keyboardRows, loseMessages, winMessages } from '../util/constants';

const WORDS = wordsList;

@Component({
  selector: 'app-pickle-game',
  templateUrl: './pickle.component.html',
  styleUrls: ['./pickle.component.scss'],
})
export class PickleComponent implements OnInit {
  @ViewChildren('tryContainer') tryContainers!: QueryList<ElementRef>;

	// One try is one row in the UI.
	readonly tries: Try[] = [];
	// This is to make LetterState enum accessible in html template.
	readonly LetterState = LetterState;
	// Stores the state for the keyboard key indexed by keys.
	readonly curLetterStates: {[key: string]: LetterState} = {};
	readonly keyboardRows = keyboardRows;

	infoMsg = '';
	fadeOutInfoMessage = false;

	showShareDialogContainer = false;
	showShareDialog = false;
	showSettings = false;
	showHelp = false;

	private curLetterIndex = 0;
	private numSubmittedTries = 0;
	private targetWord = '';
	private won = false;

	// Stores the count for each letter from the target word.
	private targetWordLetterCounts: {[letter: string]: number} = {};

  	constructor() {
	}

    ngOnInit(): void {
        // Populate initial state of "tries".
		for (let i = 0; i < NUM_TRIES; i++) {
			const letters: Letter[] = [];
			for (let j = 0; j < WORD_LENGTH; j++) {
				letters.push({text: '', state: LetterState.PENDING});
			}
			this.tries.push({letters});
		}

		this.targetWord = 'pickle';

		// Generate letter counts for target word.
		for (const letter of this.targetWord) {
			const count = this.targetWordLetterCounts[letter];
			if (count == null) {
				this.targetWordLetterCounts[letter] = 0;
			}
			this.targetWordLetterCounts[letter]++;
		}
    }

	@HostListener('document:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		this.handleClickKey(event.key);
	}

	// Returns the classes for the given keyboard key based on its state.
	getKeyClass(key: string): string {
		const state = this.curLetterStates[key.toLowerCase()];
		switch (state) {
		case LetterState.FULL_MATCH:
			return 'match key';
		case LetterState.PARTIAL_MATCH:
			return 'partial key';
		case LetterState.WRONG:
			return 'wrong key';
		default:
			return 'key';
		}
	}

	handleClickKey(key: string) {
		if (this.won) {
			return;
		}

		// If key is a letter, update the text in the corresponding letter object.
		if (LETTERS[key.toLowerCase()]) {
			// Only allow typing letters in the current try. Don't go over if the
			// current try has not been submitted.
			if (this.curLetterIndex < (this.numSubmittedTries + 1) * WORD_LENGTH) {
				this.setLetter(key);
				this.curLetterIndex++;
			}
		} else if (key === 'Backspace') {
			// Don't delete previous try.
			if (this.curLetterIndex > this.numSubmittedTries * WORD_LENGTH) {
				this.curLetterIndex--;
				this.setLetter('');
			}
		} else if (key === 'Enter') {
			this.checkCurrentTry();
		}
	}

	handleClickShare() {
		// 🟩🟨⬜
		let clipboardContent = '';
		for (let i = 0; i < this.numSubmittedTries; i++) {
			for (let j = 0; j < WORD_LENGTH; j++) {
				const letter = this.tries[i].letters[j];
				switch (letter.state) {
				case LetterState.FULL_MATCH:
					clipboardContent += '🟩';
					break;
				case LetterState.PARTIAL_MATCH:
					clipboardContent += '🟨';
					break;
				case LetterState.WRONG:
					clipboardContent += '⬜';
					break;
				default:
					break;
				}
			}
			clipboardContent += '\n';
		}
		navigator.clipboard.writeText(clipboardContent);
		this.showShareDialogContainer = false;
		this.showShareDialog = false;
		this.showInfoMessage('Copied results to clipboard');
	}

	private setLetter(letter: string) {
		const tryIndex = Math.floor(this.curLetterIndex / WORD_LENGTH);
		const letterIndex = this.curLetterIndex - tryIndex * WORD_LENGTH;
		this.tries[tryIndex].letters[letterIndex].text = letter;
	}

	private async checkCurrentTry() {
		// Check if user has typed all the letters.
		const curTry = this.tries[this.numSubmittedTries];
		if (curTry.letters.some(letter => letter.text === '')) {
			this.showInfoMessage('Not enough letters');
			// Shake the current row.
			const tryContainer = this.tryContainers.get(this.numSubmittedTries)?.nativeElement as HTMLElement;
			tryContainer.classList.add('shake');
			setTimeout(() => {
				tryContainer.classList.remove('shake');
			}, 500);
			return;
		}

		// Check if the current try is a word in the list.
		const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase();
		if (!WORDS.includes(wordFromCurTry.toLowerCase())) {
			this.showInfoMessage('Not in word list');
			// Shake the current row.
			const tryContainer = this.tryContainers.get(this.numSubmittedTries)?.nativeElement as HTMLElement;
			tryContainer.classList.add('shake');
			setTimeout(() => {
				tryContainer.classList.remove('shake');
			}, 500);
			return;
		}

		// Check if the current try matches the target word.
		// Stores the check results.
		// Clone the counts map. Need to use it in every check with the initial values.
		const targetWordLetterCounts = {...this.targetWordLetterCounts};
		const states: LetterState[] = [];
		for (let i = 0; i < WORD_LENGTH; i++) {
			const expected = this.targetWord[i];
			const curLetter = curTry.letters[i];
			const got = curLetter.text.toLowerCase();
			let state = LetterState.WRONG;
			// Need to make sure only performs the check when the letter has not been
			// checked before.
			if (expected === got && targetWordLetterCounts[got] > 0) {
				targetWordLetterCounts[expected]--;
				state = LetterState.FULL_MATCH;
			} else if (
				this.targetWord.includes(got) && targetWordLetterCounts[got] > 0) {
				targetWordLetterCounts[got]--;
				state = LetterState.PARTIAL_MATCH;
			}
			states.push(state);
		}

		// Animate
		// Get the current try.
		const tryContainer = this.tryContainers.get(this.numSubmittedTries)?.nativeElement as HTMLElement;
		// Get the letter elements.
		const letterEles = tryContainer.querySelectorAll('.letter-container');
		for (let i = 0; i < letterEles.length; i++) {
			const curLetterEle = letterEles[i];
			curLetterEle.classList.add('fold');
			// Wait for the fold animation to finish.
			await this.wait(180);
			// Update state. This will also update styles.
			curTry.letters[i].state = states[i];
			// Unfold.
			curLetterEle.classList.remove('fold');
			await this.wait(180);
		}

		// Save to keyboard key states.
		// Do this after the current try has been submitted and the animation above is done.
		for (let i = 0; i < WORD_LENGTH; i++) {
			const curLetter = curTry.letters[i];
			const got = curLetter.text.toLowerCase();
			const curStoredState = this.curLetterStates[got];
			const targetState = states[i];
			if (curStoredState == null || targetState > curStoredState) {
				this.curLetterStates[got] = targetState;
			}
		}

		this.numSubmittedTries++;

		// Check if all letters in the current try are correct.
		if (states.every(state => state === LetterState.FULL_MATCH)) {
			let msg = this.getRandomMessage(winMessages);
			this.showInfoMessage(msg);
			this.won = true;
			// Bounce animation.
			for (let i = 0; i < letterEles.length; i++) {
				const curLetterEle = letterEles[i];
				curLetterEle.classList.add('bounce');
				await this.wait(160);
			}
			await this.wait(1500);
			this.toggleShare();
			return;
		}

		// Running out of tries. Show correct answer.
		if (this.numSubmittedTries === NUM_TRIES) {
			let msg = this.getRandomMessage(loseMessages);
			this.showInfoMessage(msg);
			await this.wait(1500);
			this.toggleShare();
		}
	}

	private showInfoMessage(msg: string, hide = true) {
		this.infoMsg = msg;
		if (hide) {
			// Hide after 2s.
			setTimeout(() => {
				this.fadeOutInfoMessage = true;
				// Reset when animation is done.
				setTimeout(() => {
					this.infoMsg = '';
					this.fadeOutInfoMessage = false;
				}, 500);
			}, 2000);
		}
	}

	toggleSettings() {
		this.showSettings = !this.showSettings;
	}

	toggleHelp() {
		this.showHelp = !this.showHelp;
	}

	private async wait(ms: number) {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, ms);
		})
	}

	toggleShare() {
		this.showShareDialogContainer = !this.showShareDialogContainer;
		this.showShareDialog = !this.showShareDialog;
	}

	getRandomMessage(messages): string {
		return messages[Math.floor(Math.random() * messages.length)];
	}

	toggleDarkMode(){
		document.body.classList.toggle('dark-theme');
		console.log(document.body.classList);
	}
}
