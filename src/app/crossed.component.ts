import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';

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

    diagonalToggle = false;
    diagonalFocus: boolean = false;

    focusedRowIndex = 0;
    currentLetterIndex = 0;

    completedRows: Number[] = [];

    hintText = '';

    // temp global for testing
    words = ['balls', 'punky', 'jumbo', 'craps', 'itchy'];
    diagonalWord = ['bumpy'];
    hints = ['Hint 1', 'Hint 2', 'Hint 3', 'Hint 4', 'Hint 5'];

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
        console.log(this.hints[wordIndex]);
        this.hintText = this.hints[wordIndex];
    }

    hideHint(): void {
        // TODO
        console.log('Previous hint hidden.')
        this.hintText = '';
    }

    focusRow(wordIndex: number): void {
        console.log(String(wordIndex+1) + ' focused.');
        // set current row
        this.focusedRowIndex = wordIndex;
        this.currentLetterIndex = 0;
    }

    handleClickKey(key: any): void {
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
                this.currentLetterIndex--;
                this.setLetter('');
            }
        }
        // Submit the current try and check.
        else if (key === 'Enter') {
            this.checkCurrentTry();
        }
    }

    setLetter(letter: string): void {
        this.tries[this.focusedRowIndex].letters[this.currentLetterIndex].text = letter;
    }

    private async checkCurrentTry() {
        // seperate logic to check diagonal
        if (this.diagonalFocus) {
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
                let currLetter = diagonalTry[i].text;
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

            


        } else {

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
