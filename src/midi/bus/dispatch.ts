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

import { MidiEvent, MidiHandler, RouteFilter, Channel, Status, Disposable } from "../types";

/**
 * A compiled route filter using bitmasks for O(1) matching.
 * Channel mask: 16 bits (one per channel). Status mask: 16 bits (statuses 0x08-0x0e mapped to bits 0-6).
 */
interface CompiledRoute {
  channelMask: number;
  statusMask: number;
  sourceFilter: string | undefined;
  handler: MidiHandler;
}

function compileChannelMask(filter?: RouteFilter): number {
  if (!filter?.channel) return 0xffff; // all channels
  const channels = Array.isArray(filter.channel) ? filter.channel : [filter.channel];
  let mask = 0;
  for (const ch of channels) {
    mask |= 1 << ch;
  }
  return mask;
}

function compileStatusMask(filter?: RouteFilter): number {
  if (!filter?.status) return 0x7f; // all channel message statuses (bits 0-6)
  const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
  let mask = 0;
  for (const s of statuses) {
    mask |= 1 << (s - 0x08);
  }
  return mask;
}

/**
 * Dispatch engine for a single bus. Evaluates all subscriptions
 * with O(1) bitmask matching per route, O(n) over route count.
 */
export class Dispatcher {
  private routes: CompiledRoute[] = [];

  addRoute(handler: MidiHandler, filter?: RouteFilter): Disposable {
    const route: CompiledRoute = {
      channelMask: compileChannelMask(filter),
      statusMask: compileStatusMask(filter),
      sourceFilter: filter?.source,
      handler,
    };
    this.routes.push(route);

    return {
      dispose: () => {
        const idx = this.routes.indexOf(route);
        if (idx !== -1) {
          this.routes[idx] = this.routes[this.routes.length - 1];
          this.routes.pop();
        }
      },
    };
  }

  dispatch(event: MidiEvent): void {
    const channelBit = 1 << event.channel;
    const statusBit = 1 << (event.status - 0x08);

    for (let i = 0, len = this.routes.length; i < len; i++) {
      const route = this.routes[i];
      if ((route.channelMask & channelBit) && (route.statusMask & statusBit)
        && (!route.sourceFilter || route.sourceFilter === event.source)) {
        route.handler(event);
      }
    }
  }

  get routeCount(): number {
    return this.routes.length;
  }

  clear(): void {
    this.routes.length = 0;
  }
}
