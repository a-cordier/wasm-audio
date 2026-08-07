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

const loaded = new WeakMap<BaseAudioContext, Map<string, Promise<void>>>();

/**
 * Idempotent audioWorklet.addModule(): a second addModule() of the same URL
 * re-evaluates the module in the AudioWorkletGlobalScope, and its
 * registerProcessor() call throws NotSupportedError. Callers (one per mounted
 * device) can therefore request their modules without tracking what other
 * mounts already loaded. In-flight loads are deduped too; a failed load is
 * evicted so it can be retried.
 */
export function addWorkletModuleOnce(
  ctx: BaseAudioContext,
  url: string
): Promise<void> {
  let modules = loaded.get(ctx);
  if (!modules) {
    modules = new Map();
    loaded.set(ctx, modules);
  }
  let pending = modules.get(url);
  if (!pending) {
    pending = ctx.audioWorklet.addModule(url).catch((err) => {
      modules!.delete(url);
      throw err;
    });
    modules.set(url, pending);
  }
  return pending;
}
