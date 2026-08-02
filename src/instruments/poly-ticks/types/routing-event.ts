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
// String-valued: the voice panel emits both these and OscillatorEvent through
// the same change listener, and numeric enums would collide on 0, 1, 2.
export enum RoutingEvent {
  ROUTING = "ROUTING",
  FM_INDEX = "FM_INDEX",
  SUB_LEVEL = "SUB_LEVEL",
}

export enum SpaceEvent {
  SPREAD = "SPREAD",
  WIDTH = "WIDTH",
  DRIFT = "DRIFT",
}
