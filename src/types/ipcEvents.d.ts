export interface IpcEvents {
  'ping': void;
  'open-popup': void
  'app:window:get-position': [number, number];
  'app:window:set-position': { x: number; y: number };
  'app:window:mouse-enter': void;
  'app:window:mouse-leave': void;
  'app:window:restore-main': { route?: string };
  'app:route': { route: string };
}
