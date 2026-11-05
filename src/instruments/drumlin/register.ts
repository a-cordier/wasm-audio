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

import { pluginRegistry } from "../../core/plugin-registry";
import { DrumlinController } from "./drumlin-controller";
import "./ui/drumlin-element";

// NOTE: "drumlin-processor.js" is served via vite.config.ts's `workletFiles`
// map (the conventions guard asserts the entry exists).
pluginRegistry.register({
  descriptor: {
    id: "drumlin",
    name: "DRUMLIN",
    kind: "instrument",
    accent: "var(--drumlin-accent)",
    type: "instrument",
  },
  controllerFactory: (ctx) => new DrumlinController(ctx),
  elementTag: "drumlin-element",
  workletModules: ["drumlin-processor.js"],
  // -12 puts the computer keyboard on 36..62: the whole GM drum map in reach
  // (w=KICK, x/c=SNARE, z=CLAP, e/r=CH, t=OH, v/b/n/q/s/d=TOMs).
  keyboardOctaveShift: -12,
});
