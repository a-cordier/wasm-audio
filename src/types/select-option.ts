export interface SelectOption {
  value: any;
  name: string;
}

export class SelectOptions {
  private options: SelectOption[];
  private currentOption = 0;

  public map: Function;

  constructor(options: SelectOption[]) {
    this.options = options;
    this.map = options.map.bind(options);
  }

  get size() {
    return this.options.length;
  }

  set index(index: number) {
    this.currentOption = index - 1;
    this.next();
  }

  get index() {
    return this.currentOption;
  }

  selectValue(value) {
    const idx = this.options.findIndex((option) => option.value === value);
    if (idx > -1) {
      this.currentOption = idx;
    }
  }

  select(index: number): SelectOptions {
    this.currentOption = index;
    return this;
  }

  next() {
    if (++this.currentOption >= this.options.length) {
      this.currentOption = 0;
    }
    return this;
  }

  previous() {
    if (--this.currentOption < 0) {
      this.currentOption = this.options.length - 1;
    }
    return this;
  }

  getCurrent(): SelectOption {
    return this.options[this.currentOption];
  }
}
