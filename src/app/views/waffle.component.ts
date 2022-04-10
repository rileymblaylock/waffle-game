import {Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import { Try, LetterState, NUM_TRIES, Letter, WORD_LENGTH, WAFFLE_EMOJI, keyboardRows, date, targetWord } from '../util/constants';

@Component({
    selector: 'app-waffle-game',
    templateUrl: './waffle.component.html',
    styleUrls: ['./waffle.component.scss'],
})
export class WaffleComponent implements OnInit {
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
    darkMode = false;
    showShareButton = false;
    dayNumber = 0;

	private curLetterIndex = 0;
	private numSubmittedTries = 0;
	private won = false;

	// Stores the count for each letter from the target word.
	private targetWordLetterCounts: {[letter: string]: number} = {};

  	constructor() {
	}

    ngOnInit(): void {

        this.startTimer();

        this.getCurrentDaysSince();

        const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (userPrefersDark) {
            this.toggleDarkMode();
        }

        this.initBoard();

        this.initIfWin();
    }

    startTimer() {
        let div=document.getElementById("timer");
 
        setInterval(function(){ 
            var toDate=new Date();
            var tomorrow=new Date();
            tomorrow.setHours(24,0,0,0);
            var diffMS=tomorrow.getTime()/1000-toDate.getTime()/1000;
            var diffHr=Math.floor(diffMS/3600);
            diffMS=diffMS-diffHr*3600;
            var diffMi=Math.floor(diffMS/60);
            diffMS=diffMS-diffMi*60;
            var diffS=Math.floor(diffMS);
            var result=((diffHr<10)?"0"+diffHr:diffHr);
            result+=":"+((diffMi<10)?"0"+diffMi:diffMi);
            result+=":"+((diffS<10)?"0"+diffS:diffS);
            div.innerHTML = String(result);
        }, 1000);
    }

    private getCurrentDaysSince() {
        let days = 0;
        let currentDate = new Date();
        let startDate = new Date(date);
        days = currentDate.getTime() - startDate.getTime();
        days = Math.floor(days / (1000 * 3600 * 24));
        this.dayNumber = days;
    }

    initBoard() {
		for (let i = 0; i < NUM_TRIES; i++) {
			const letters: Letter[] = [];
			for (let j = 0; j < WORD_LENGTH; j++) {
				letters.push({text: '', state: LetterState.PENDING});
			}
			this.tries.push({letters});
		}

		for (const letter of targetWord) {
			const count = this.targetWordLetterCounts[String(letter)];
			if (count == null) {
				this.targetWordLetterCounts[String(letter)] = 0;
			}
			this.targetWordLetterCounts[String(letter)]++;
		}
    }

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

		if (key === WAFFLE_EMOJI) {
			if (this.curLetterIndex < (this.numSubmittedTries + 1) * WORD_LENGTH) {
				this.setLetter(key);
				this.curLetterIndex++;
			}
		} else if (key === 'Backspace') {
			if (this.curLetterIndex > this.numSubmittedTries * WORD_LENGTH) {
				this.curLetterIndex--;
				this.setLetter('');
			}
		} else if (key === 'Enter') {
			this.checkCurrentTry();
		}
	}

	handleClickShare() {
		let clipboardContent = 'WAFFLE #' + this.dayNumber + ' 1/6\n🧇🧇🧇🧇🧇';
		navigator.clipboard.writeText(clipboardContent);
		this.showShareDialogContainer = false;
		this.showShareDialog = false;
		this.showInfoMessage('RESULTS COPIED TO CLIPBOARD');
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
			this.showInfoMessage(WAFFLE_EMOJI);
			const tryContainer = this.tryContainers.get(this.numSubmittedTries)?.nativeElement as HTMLElement;
			tryContainer.classList.add('shake');
			setTimeout(() => {
				tryContainer.classList.remove('shake');
			}, 500);
			return;
		}

        // Set states if target word
        const states: LetterState[] = [];
        if (curTry.letters.every(letter => letter.text === WAFFLE_EMOJI)) {
            for (let i = 0; i < WORD_LENGTH; i++) {
                states.push(LetterState.FULL_MATCH);
            }
        }

		// Animate
		const tryContainer = this.tryContainers.get(this.numSubmittedTries)?.nativeElement as HTMLElement;
		// Get the letter elements.
		const letterEles = tryContainer.querySelectorAll('.letter-container');
		for (let i = 0; i < letterEles.length; i++) {
			const curLetterEle = letterEles[i];
			curLetterEle.classList.add('fold');
			await this.wait(180);
			curTry.letters[i].state = states[i];
			curLetterEle.classList.remove('fold');
			await this.wait(180);
		}

		// Save to keyboard key states
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
			let msg = WAFFLE_EMOJI;
			this.showInfoMessage(msg);
			this.won = true;
            this.showShareButton = true;
			// Bounce animation.
			for (let i = 0; i < letterEles.length; i++) {
				const curLetterEle = letterEles[i];
				curLetterEle.classList.add('bounce');
				await this.wait(160);
			}
			await this.wait(1500);
			this.toggleShare();
            localStorage.setItem('Win', String(this.dayNumber));
			return;
		}
	}

	private showInfoMessage(msg: string, hide = true) {
		this.infoMsg = msg;
		if (hide) {
			setTimeout(() => {
				this.fadeOutInfoMessage = true;
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
		return messages[0];
	}

	toggleDarkMode() {
        this.darkMode = !this.darkMode
		document.body.classList.toggle('dark-theme');
	}

    // TODO
    private async initIfWin() {
        if (Number(String(localStorage.getItem('Win'))) === this.dayNumber) {
            this.won = true;
            this.showShareButton = true;
            for (let i = 0; i < 5; i++) {
                this.tries[0].letters.pop();
            }
            for (let i = 0; i < 5; i++) {
                this.handleClickKey(WAFFLE_EMOJI);
                this.tries[0].letters.push({text: WAFFLE_EMOJI, state: LetterState.FULL_MATCH});
            }
            this.curLetterStates[WAFFLE_EMOJI] = LetterState.FULL_MATCH;
            setTimeout(() => {
                this.toggleShare();
            }, 1000);
        } else {
            localStorage.clear();
        }
    }
}
