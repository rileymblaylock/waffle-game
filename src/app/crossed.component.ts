import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';

// Letter map.
const LETTERS = (() => {
    // letter -> true. Easier to check.
    const ret: {[key: string]: boolean} = {};
    for (let charCode = 97; charCode < 97 + 26; charCode++) {
      ret[String.fromCharCode(charCode)] = true;
    }
    return ret;
  })();
  
// One try.
interface Try {
    letters: Letter[];
}

// One letter in a try.
interface Letter {
    text: string;
    state: LetterState;
}
  
enum LetterState {
    // you know.
    WRONG,
    // letter in word but position is wrong.
    PARTIAL_MATCH,
    // letter and position are all correct.
    FULL_MATCH,
    // before the current try is submitted.
    PENDING,
}

@Component({
  selector: 'app-crossed',
  templateUrl: './crossed.component.html',
  styleUrls: ['./crossed.component.scss']
})
export class CrossedComponent implements OnInit {
    @ViewChildren('row') row!: QueryList<ElementRef>;
    @ViewChildren('letter') letter!: QueryList<ElementRef>;
    // Stores all tries.
    // One try is one row in the UI.
    readonly tries: Try[] = [];

    // This is to make LetterState enum accessible in html template.
    readonly LetterState = LetterState;

    tempSaveState = LetterState;

    // Stores the state for the keyboard key indexed by keys.
    readonly curLetterStates: {[key: string]: LetterState} = {};

    diagonalToggle = false;
    diagonalFocus: boolean = false;

    currentDiagonalSaveState: Letter[] = [];

    focusedRowIndex = 0;
    currentLetterIndex = 0;

    completedRows: Number[] = [];

    won = false;
    attempts = 0;

    hintText = '';

    // temp global for testing
    words = ['balls', 'punky', 'jumbo', 'craps', 'itchy'];
    diagonalWord = ['bumpy'];
    hints = ['spheres', 'skatey', 'large', 'poker', 'scratchy'];

    letters = [];

    // Keyboard rows.
    readonly keyboardRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
    ];

    constructor(){}

    ngOnInit(): void {
        // init word and letters object
        for (let i = 0; i < 5; i++) {
            const letters: Letter[] = [];
            for (let j = 0; j < 5; j++) {
              letters.push({text: '', state: LetterState.PENDING});
            }
            this.tries.push({letters});
        }

        // // init save state diagonal so we can modify any index
        // for (let i = 0; i < 5; i++) {
        //     this.currentDiagonalSaveState.push({text: '', state: LetterState.PENDING});
        // }

        //focus first row
        this.toggleFocus(0, 0);
    }

    toggleFocus(wordIndex: number, letterIndex: number): void {
        if (letterIndex == 0) {
            if (wordIndex == 0) {
                if (this.diagonalToggle) {
                    // hide any visible hints
                    this.hideHint();
                    // toggle selection for diagonal
                    console.log('Diagonal focused.');
                    this.diagonalToggle = !this.diagonalToggle;
                    this.diagonalFocus = true;
                    // focus diagonal
                    this.focusRow(wordIndex);
                } else {
                    this.diagonalToggle = !this.diagonalToggle;
                    this.diagonalFocus = false;
                    this.hideHint();
                    this.showHint(wordIndex);
                    this.focusRow(wordIndex);
                }
            } else {
                // Reset diagonal toggle to false
                this.diagonalToggle = false;
                this.diagonalFocus = false;
                // Hide hint if any visible
                this.hideHint();
                // display hint for given word index
                this.showHint(wordIndex);
                // toggle selection for given row index
                this.focusRow(wordIndex);
            }
        }
    }

    showHint(wordIndex: number): void {
        // temp
        this.hintText = this.hints[wordIndex];
    }

    hideHint(): void {
        // TODO
        this.hintText = '';
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        this.handleClickKey(event.key);
    }

    // Returns the classes for the given keyboard key based on its state.
    getKeyClass(key: string): string {
        if (this.diagonalFocus) {
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
        } else {
            return 'key';
        }
    }

    focusRow(wordIndex: number): void {
        // set current row
        this.focusedRowIndex = wordIndex;
        this.currentLetterIndex = 0;

        // temporarily add clear class to diagonal for entry
        this.currentDiagonalSaveState = [];
        if (this.diagonalFocus) {
            for (let i = 0; i < 5; i++) {
                // const tryContainer = this.row?.get(i)?.nativeElement as HTMLElement;
                // const letterEles = tryContainer?.querySelectorAll('.letter-container');
                // if (letterEles && this.tries[i].letters[i].state !== (LetterState.FULL_MATCH || LetterState.PARTIAL_MATCH)) {
                //     const curLetterEle = letterEles[i];
                //     curLetterEle?.classList?.add('clear');
                // }
                const temp = Object.assign({}, this.tries[i].letters[i]);
                this.currentDiagonalSaveState.push(temp);
            }
        } else {
            // remove empty class on focus away
            for (let i = 0; i < 5; i++) {
                const tryContainer = this.row?.get(i)?.nativeElement as HTMLElement;
                const letterEles = tryContainer?.querySelectorAll('.letter-container');
                if (letterEles) {
                    const curLetterEle = letterEles[i];
                    curLetterEle?.classList?.remove('clear');
                }
            }
        }
    }

    handleClickKey(key: any): void {
        if (!this.won) {
            if (LETTERS[key.toLowerCase()]) {
                // don't go over word length
                if (this.currentLetterIndex < 5) {
                    // type on diagonal
                    if (this.diagonalFocus) {
                            this.setLetter(key);
                            this.currentLetterIndex++;
                            this.focusedRowIndex++;
                    // type horizontal
                    } else {
                        if(!this.completedRows.includes(this.focusedRowIndex)) {
                            this.setLetter(key);
                            this.currentLetterIndex++;
                        }
                    }
                }
            }
            // Handle delete.
            else if (key === 'Backspace') {
                // don't go under 0
                if (this.currentLetterIndex > 0) {
                    if (this.diagonalFocus) {
                        this.focusedRowIndex--;
                        this.currentLetterIndex--;
                        this.setLetter('');
                    } else {
                        this.currentLetterIndex--;
                        this.setLetter('');
                    }
                }
            }
            // Submit the current try and check.
            else if (key === 'Enter') {
                if (!this.won) {
                    this.checkCurrentTry();
                }
            }
        }
    }

    // TODO - clear state if enter a new letter into already grey or yellow box, and put state back on backspace
    setLetter(letter: string): void {
        // clears blur on diagonal letter entry per letter
        if (this.diagonalFocus) {
            const tryContainer = this.row.get(this.focusedRowIndex)?.nativeElement as HTMLElement;
            const letterEles = tryContainer.querySelectorAll('.letter-container');
            const curLetterEle = letterEles[this.focusedRowIndex];
            curLetterEle.classList.remove('clear');
        }
        if (this.tries[this.focusedRowIndex].letters[this.currentLetterIndex].state !== LetterState.FULL_MATCH) {
            this.tries[this.focusedRowIndex].letters[this.currentLetterIndex].text = letter;

            //either gray or yellow
            if (this.tries[this.focusedRowIndex].letters[this.currentLetterIndex].state !== LetterState.PENDING) {
                //clear state, but save state
                // TO-DO SAVE STATE, CHECK IF BACKSPACE
                this.tries[this.focusedRowIndex].letters[this.currentLetterIndex].state = LetterState.PENDING;
            }
        }
    }

    private async checkCurrentTry() {
        // seperate logic to check diagonal

        // TODO - block user input until this function finishes

        if (this.diagonalFocus) {

            this.attempts++;

            // get letters of diagonal
            let diagonalTry = [];
            for (let i = 0; i < 5; i++) {
                // letters of the diagonal
                diagonalTry.push(this.tries[i].letters[i]);
            }

            // check all letters are nonempty
            for (let i = 0; i < 5; i++) {
                if (diagonalTry[i].text === '') {
                    console.log('Not enough letters');
                    return;
                }
            }

            const trueWord = this.diagonalWord[0];

            // we will save states upon checking to this states array
            const states: LetterState[] = [];

            // update letter states of the current try
            for (let i = 0; i < 5; i++) {
                let state = LetterState.WRONG;
                let currLetter = diagonalTry[i].text.toLowerCase();
                // GREEN OR YELLOW
                if (trueWord.includes(currLetter)) {
                    // GREEN
                    if (trueWord[i] === currLetter){
                        state = LetterState.FULL_MATCH;
                    // YELLOW
                    } else {
                        state = LetterState.PARTIAL_MATCH;
                    }
                }
                states.push(state);
            }

            // Animate, update states
            for (let i = 0; i < 5; i++) {
                const tryContainer = this.row.get(i)?.nativeElement as HTMLElement;
                const letterEles = tryContainer.querySelectorAll('.letter-container');
                const curLetterEle = letterEles[i];
                curLetterEle.classList.add('fold');
                await this.wait(180);
                diagonalTry[i].state = states[i];
                curLetterEle.classList.remove('fold');
                await this.wait(180);
            }

            // Save to keyboard key states.
            for (let i = 0; i < 5; i++) {
                const curLetter = diagonalTry[i];
                const got = curLetter.text.toLowerCase();
                const curStoredState = this.curLetterStates[got];
                const targetState = states[i];
                if (curStoredState == null || targetState > curStoredState) {
                    this.curLetterStates[got] = targetState;
                }
            }

            // Restore diagonal greys to previous grays
            // unless space was clear, then keep new grays
            for (let i = 0; i < 5; i++) {
                if (states[i] === (LetterState.WRONG)) {
                    // const tryContainer = this.row.get(i)?.nativeElement as HTMLElement;
                    // const letterEles = tryContainer.querySelectorAll('.letter-container');
                    // const curLetterEle = letterEles[i];
                    // curLetterEle.classList.add('blur');
                    if (this.completedRows.includes(i)) {
                        this.tries[i].letters[i] = Object.assign({}, this.currentDiagonalSaveState[i]);
                    }
                }
            }

            this.diagonalToggle = !this.diagonalToggle;
            this.toggleFocus(0, 0);

            if (states.every(state => state === LetterState.FULL_MATCH)) {
                console.log('You have won.');
                this.won = true;

                // Animate with bounch
                for (let i = 0; i < 5; i++) {
                    const tryContainer = this.row.get(i)?.nativeElement as HTMLElement;
                    // Get the letter elements.
                    const letterEles = tryContainer.querySelectorAll('.letter-container');
                    const curLetterEle = letterEles[i];
                    curLetterEle.classList.add('bounce');
                    // Wait for the fold animation to finish.
                    await this.wait(180);
                }
            }

            if (this.attempts >= 3 && !this.won) {
                this.won = true;
                console.log('You lose!');
            }

        } else {
            if (!this.completedRows.includes(this.focusedRowIndex)) {
                const currentTry = this.tries[this.focusedRowIndex];
                // we will save states upon checking to this states array
                const states: LetterState[] = [];

                // if not 5 actual letters
                if (currentTry.letters.some(letter => letter.text === '')) {
                    console.log('Not enough letters');
                    return;
                }

                // current word in string form
                const wordFromCurTry = currentTry.letters.map(letter => letter.text).join('').toLowerCase();
                // TODO - see if valid word
                //
                //

                //actual word to be guessed
                const trueWord = this.words[this.focusedRowIndex];

                //diagonal word
                const diagonalWord = this.diagonalWord[0];

                // update letter states of the current try
                for (let i = 0; i < 5; i++) {
                    let state = LetterState.WRONG;
                    let currLetter = wordFromCurTry[i];
                    // GREEN OR YELLOW
                    if (trueWord.includes(currLetter)) {
                        // GREEN
                        if (trueWord[i] === currLetter){
                            state = LetterState.FULL_MATCH;
                        // YELLOW
                        } else {
                            state = LetterState.PARTIAL_MATCH;
                        }
                    } else if (i === this.focusedRowIndex && diagonalWord.includes(currLetter)) {
                        state = LetterState.PARTIAL_MATCH;
                    }
                    states.push(state);
                }

                // Animate, update states
                // Get the current row
                const tryContainer = this.row.get(this.focusedRowIndex)?.nativeElement as HTMLElement;
                // Get the letter elements.
                const letterEles = tryContainer.querySelectorAll('.letter-container');
                for (let i = 0; i < letterEles.length; i++) {
                    // "Fold" the letter, apply the result (and update the style), then unfold
                    const curLetterEle = letterEles[i];
                    curLetterEle.classList.add('fold');
                    // Wait for the fold animation to finish.
                    await this.wait(180);
                    // Update state. This will also update styles.
                    currentTry.letters[i].state = states[i];
                    // Unfold.
                    curLetterEle.classList.remove('fold');
                    await this.wait(180);
                }

                // keep track of completed rows so we won't modify them again
                this.completedRows.push(this.focusedRowIndex);

                // Save to keyboard key states, but only along diagonal
                //
                // Do this after the current try has been submitted and the animation above
                // is done.
                const curLetter = currentTry.letters[this.focusedRowIndex];
                const got = curLetter.text.toLowerCase();
                const curStoredState = this.curLetterStates[got];
                const targetState = states[this.focusedRowIndex];
                // This allows override state with better result.
                //
                // For example, if "A" was partial match in previous try, and becomes full
                // match in the current try, we update the key state to the full match
                // (because its enum value is larger).
                if (curStoredState == null || targetState > curStoredState) {
                    this.curLetterStates[got] = targetState;
                }
            }
        }
    }

    private async wait(ms: number) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, ms);
        })
    }
}
