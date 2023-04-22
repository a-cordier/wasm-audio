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
export class Dispatcher extends EventTarget {
  private observers = new Map<Function, EventListenerOrEventListenerObject>();

  dispatch(actionId: string, detail: any) {
    this.dispatchEvent(new CustomEvent(actionId, { detail }));
    return this;
  }

  subscribe(actionId: string, callback: (detail: any) => void) {
    const observer = (event: CustomEvent) => {
      callback(event.detail);
    };
    this.observers.set(callback, observer);
    this.addEventListener(actionId, observer);
    return this;
  }

  unsubscribe(actionId: string, callback: (detail: any) => void) {
    this.removeEventListener(actionId, this.observers.get(callback));
    this.observers.delete(callback);
    return this;
  }
}

export const GlobalDispatcher = new Dispatcher();
