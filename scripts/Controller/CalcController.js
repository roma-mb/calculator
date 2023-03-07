class CalcController {
  constructor() {
    this._audio = new Audio("click.mp3");
    this._displayCalcEl = document.querySelector("#display");
    this._hourEl = document.querySelector("#hour");
    this._currentDateEl = document.querySelector("#date");

    this._locale = "pt-BR";
    this._lastNumber = "";
    this._lastOperator = "";
    this._commands = [];
    this._operations = [];
    this._audioOnOff = false;

    this.initialize();
    this.initiButtonsEvents();
  }

  get displayCalc() {
    return this._displayCalcEl.innerHTML;
  }

  set displayCalc(value) {
    this._displayCalcEl.innerHTML = !(value.toString().length > 10)
      ? value
      : "ERROR";
  }

  get displayHour() {
    return this._hourEl.innerHTML;
  }

  set displayHour(value) {
    this._hourEl.innerHTML = value;
  }

  get displayDate() {
    return new Date();
  }

  set displayDate(value) {
    this._currentDateEl.innerHTML = value;
  }

  initialize() {
    this.defineDisplayDateTime();

    setInterval(() => {
      this.defineDisplayDateTime();
    }, 1000);

    this.pastEvent();
    this.toggleAudioEvent();
  }

  initiButtonsEvents() {
    let buttons = document.querySelectorAll("#buttons > g", "#parts > g");

    buttons.forEach((button) => {
      this.addEventListenerAll(
        button,
        "mouseover, mouseup, mousedown",
        (event) => {
          button.style.cursor = "pointer";
        }
      );

      this.addEventListenerAll(button, "click, drag", (event) => {
        let buttonEntry = button.className.baseVal.replace("btn-", "");

        this.displayCalc = this.executeEntry(buttonEntry);
      });
    });

    document.addEventListener("keyup", (event) => {
      this.displayCalc = this.executeEntry(event.key);
    });
  }

  defineDisplayDateTime() {
    this.displayHour = this.displayDate.toLocaleTimeString(this._locale);
    this.displayDate = this.displayDate.toLocaleDateString(this._locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  addEventListenerAll(button, events, callback) {
    events.split(", ").forEach((event) => {
      button.addEventListener(event, callback, false);
    });
  }

  executeEntry(buttonEntry) {
    this.playAudio();

    let hasMethod = this.getMethods()[buttonEntry];

    return hasMethod ? this[hasMethod]() : this.buildCommands(buttonEntry);
  }

  getMethods() {
    return {
      ac: "allClear",
      ce: "clearEntry",
      percent: "percent",
      division: "division",
      multiplication: "multiplication",
      subtraction: "subtraction",
      sum: "sum",
      equal: "equal",
      dot: "dot",
      Escape: "allClear",
      Backspace: "clearEntry",
      "%": "percent",
      "/": "division",
      "*": "multiplication",
      "-": "subtraction",
      "+": "sum",
      "=": "equal",
      Enter: "equal",
      ".": "dot",
      ",": "dot",
    };
  }

  buildCommands(buttonEntry) {
    this._commands.push(buttonEntry);

    if (this.hasCommand("cControl")) {
      this.emptyCommands();
      return this.copyToClipboard();
    }

    if (this.hasCommand("vControl")) {
      this.emptyCommands();
      return this.displayCalc;
    }

    if (isNaN(buttonEntry)) {
      this.emptyCommands();
      return this.displayCalc;
    }

    this.emptyCommands();

    return this.number(buttonEntry);
  }

  hasCommand(command) {
    return this._commands.join("").indexOf(command) > -1;
  }

  emptyCommands() {
    this._commands = [];
  }

  allClear() {
    this._operations = [];

    return "0";
  }

  clearEntry() {
    this._operations.pop();

    return this._operations;
  }

  percent() {
    this.buildMathOperations("%");

    return this.joinOperations();
  }

  division() {
    this.buildMathOperations("/");

    return this.joinOperations();
  }

  multiplication() {
    this.buildMathOperations("*");

    return this.joinOperations();
  }

  subtraction() {
    this.buildMathOperations("-");

    return this.joinOperations();
  }

  sum() {
    this.buildMathOperations("+");

    return this.joinOperations();
  }

  equal() {
    let lenthg = this._operations.length;

    if (lenthg <= 0) {
      return "0";
    }

    if (lenthg === 2) {
      this._lastNumber = this._operations[0];
      this._lastOperator = this._operations[1];
      this._operations.push(this._lastNumber);
    }

    if (this._lastNumber && this._lastOperator && lenthg === 1) {
      this._operations.push(this._lastOperator);
      this._operations.push(this._lastNumber);
    }

    if (lenthg === 3) {
      this._lastNumber = this._operations[2];
      this._lastOperator = this._operations[1];

      this.calculate();
    }

    return this.joinOperations();
  }

  dot() {
    let lenthg = this._operations.length;

    if (lenthg === 0 || (lenthg === 2 && isNaN(this._operations[1]))) {
      this._operations.push("0.");
    }

    if (
      lenthg === 1 &&
      !isNaN(this._operations[0]) &&
      this._operations[0].indexOf(".") === -1
    ) {
      let currentValue = this._operations[0];
      this._operations[0] = `${currentValue}.`;
    }

    if (
      lenthg === 3 &&
      !isNaN(this._operations[2]) &&
      this._operations[2].indexOf(".") === -1
    ) {
      let currentValue = this._operations[2];
      this._operations[2] = `${currentValue}.`;
    }

    return this.joinOperations();
  }

  number(buttonEntry) {
    let lastItem = this._operations[this._operations.length - 1];

    if (isNaN(lastItem)) {
      this._operations.push(buttonEntry);

      return this.joinOperations();
    }

    let concatenate = lastItem.toString() + buttonEntry.toString();

    this._operations.pop();
    this._operations.push(concatenate);

    return this.joinOperations();
  }

  buildMathOperations(buttonEntry) {
    let lenght = this._operations.length;
    let lastItem = this._operations[lenght - 1];

    if (lenght <= 0) {
      return this._operations.push("ERROR");
    }

    if (buttonEntry === "%") {
      return this.calculatePercentage(lenght);
    }

    if (lenght && lastItem && !isNaN(lastItem)) {
      if (lenght === 3) {
        this.calculate();
      }

      this._operations.push(buttonEntry);

      return this._operations;
    }

    this._operations[lenght - 1] = buttonEntry;

    return this._operations;
  }

  calculatePercentage(lenght) {
    if (lenght === 1) {
      this._operations.push("/");
      this._operations.push(100);
    }

    if (lenght === 3) {
      let actualOperator = this._operations[1];

      if (actualOperator === "/") {
        this._operations[1] = "*";
      }

      if (actualOperator === "*") {
        this.calculate();
        this._operations.push("/");
        this._operations.push(100);
      }
    }

    return this.calculate();
  }

  calculate() {
    let expression = this._operations.join("");
    let result = eval(expression);

    this._operations = [result];

    return this._operations;
  }

  joinOperations() {
    return this._operations.join("");
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.displayCalc);

    return this.joinOperations();
  }

  pastEvent() {
    document.addEventListener("paste", (event) => {
      let text = (event.clipboardData || Window.clipboardData).getData("text");
      let value = parseFloat(text);

      this.displayCalc = this.buildCommands(value);
    });
  }

  toggleAudioEvent() {
    document.querySelectorAll(".btn-ac").forEach((button) => {
      button.addEventListener("dblclick", (event) => {
        this.toggleAudio();
      });
    });
  }

  toggleAudio() {
    this._audioOnOff = !this._audioOnOff;
  }

  playAudio() {
    if (this._audioOnOff) {
      this._audio.currentTime = 0;
      this._audio.play();
    }
  }
}
