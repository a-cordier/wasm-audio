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

import { ControlSourceAdapter, ControlSignal } from "../types";
import { MidiBus } from "../../midi/bus/bus";
import { Disposable, Status } from "../../midi/types";

export class MidiControlAdapter implements ControlSourceAdapter {
  readonly protocol = "midi";
  private bus: MidiBus;
  private handler: ((signal: ControlSignal) => void) | null = null;
  private subscription: Disposable | null = null;

  constructor(bus: MidiBus) {
    this.bus = bus;
  }

  connect(): void {
    if (this.subscription) return;
    this.subscription = this.bus.subscribe((event) => {
      if (this.handler) {
        this.handler({
          sourceId: `midi:cc:${event.data1}`,
          value: event.data2,
          protocol: this.protocol,
          raw: event,
        });
      }
    }, { status: Status.CONTROL_CHANGE });
  }

  disconnect(): void {
    this.subscription?.dispose();
    this.subscription = null;
  }

  onSignal(handler: (signal: ControlSignal) => void): Disposable {
    this.handler = handler;
    return {
      dispose: () => {
        this.handler = null;
      },
    };
  }
}
