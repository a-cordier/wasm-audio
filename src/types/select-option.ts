/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
