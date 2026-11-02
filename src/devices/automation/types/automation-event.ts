/** Controller → UI mirror events (the panel subscribes, state stays owned). */
export enum AutomationEvent {
  SIGNAL = "automation:signal",
  STEPS = "automation:steps",
  TARGET = "automation:target",
}
