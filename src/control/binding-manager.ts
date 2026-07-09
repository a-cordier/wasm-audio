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

import { ReactiveController, ReactiveControllerHost } from "lit";
import { ControlID, ControlSignal, ControlBinding, ControlSourceAdapter } from "./types";
import { Disposable } from "../midi/types";

export class BindingManager extends EventTarget {
  private bindings = new Map<string, ControlID>();
  private adapters: ControlSourceAdapter[] = [];
  private subscriptions: Disposable[] = [];
  private _learningTarget: ControlID = ControlID.NONE;

  get learningTarget(): ControlID {
    return this._learningTarget;
  }

  registerSource(adapter: ControlSourceAdapter) {
    this.adapters.push(adapter);
    const sub = adapter.onSignal((signal) => this.handleSignal(signal));
    this.subscriptions.push(sub);
    adapter.connect();
  }

  startLearning(target: ControlID) {
    this._learningTarget = target;
    this.dispatchEvent(new Event("learn-state-change"));
  }

  stopLearning() {
    this._learningTarget = ControlID.NONE;
    this.dispatchEvent(new Event("learn-state-change"));
  }

  private handleSignal(signal: ControlSignal) {
    if (this._learningTarget !== ControlID.NONE) {
      this.bindings.set(signal.sourceId, this._learningTarget);
      this._learningTarget = ControlID.NONE;
      this.dispatchEvent(new Event("learn-state-change"));
    }

    const controlId = this.bindings.get(signal.sourceId);
    if (controlId !== undefined) {
      this.dispatchEvent(
        new CustomEvent("control-change", {
          detail: { controlId, value: signal.value },
        })
      );
    }
  }

  exportBindings(): ControlBinding[] {
    return Array.from(this.bindings.entries()).map(([sourceId, controlId]) => ({
      controlId,
      sourceId,
    }));
  }

  importBindings(bindings: ControlBinding[]) {
    this.bindings.clear();
    for (const { controlId, sourceId } of bindings) {
      this.bindings.set(sourceId, controlId);
    }
  }

  clearBindings() {
    this.bindings.clear();
  }

  destroy() {
    for (const sub of this.subscriptions) {
      sub.dispose();
    }
    for (const adapter of this.adapters) {
      adapter.disconnect();
    }
    this.adapters.length = 0;
    this.subscriptions.length = 0;
    this.bindings.clear();
  }
}

let instance: BindingManager | null = null;

export function getBindingManager(): BindingManager {
  if (!instance) {
    instance = new BindingManager();
  }
  return instance;
}

/**
 * Lit ReactiveController that subscribes to the singleton BindingManager's
 * learn state. Any component that creates a LearnController will re-render
 * when the learning target changes — no prop drilling needed.
 */
export class LearnController implements ReactiveController {
  private host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  get learningTarget(): ControlID {
    return getBindingManager().learningTarget;
  }

  hostConnected() {
    getBindingManager().addEventListener("learn-state-change", this.onChange);
  }

  hostDisconnected() {
    getBindingManager().removeEventListener("learn-state-change", this.onChange);
  }

  private onChange = () => {
    this.host.requestUpdate();
  };
}
