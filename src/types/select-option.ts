export interface SelectOption {
  value: string;
  name: string;
}

export class SelectOptions {
  private options: SelectOption[];
  private currentOption = 0;

  constructor(options: SelectOption[]) {
    this.options = options;
  }

  select(index: number): SelectOptions {
    this.currentOption = index;
    return this;
  }

  next() {
    if (++this.currentOption >= this.options.length) {
      this.currentOption = 0;
    }
  }

  previous() {
    if (--this.currentOption < 0) {
      this.currentOption = this.options.length - 1;
    }
  }

  getCurrent(): SelectOption {
    return this.options[this.currentOption];
  }
}
