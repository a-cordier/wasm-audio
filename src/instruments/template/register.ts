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
import { TemplateController } from "./template-controller";
import "./ui/template-element";

// NOTE: a new worklet file ("template-processor.js") must ALSO be registered in
// vite.config.ts's `workletFiles` map, or addModule() 404s in dev/build.
pluginRegistry.register({
  descriptor: {
    id: "template",
    name: "TEMPLATE",
    tag: "template-element",
    type: "instrument",
  },
  controllerFactory: (ctx) => new TemplateController(ctx),
  elementTag: "template-element",
  workletModules: ["template-processor.js"],
  keyboardOctaveShift: 0,
});
