import { sleep } from "./async.js";
import { GRANTED, PROMPT } from "./constants/permission-state.js";
import { createCoordinates } from "./geolocation-coordinates.js";
import { HandlePermissionRequest } from "./handle-permission-request.js";
import {
  StdGeolocationCoordinates,
  StdPermissionState,
  StdPermissionStatus,
} from "./types/std.js";

export interface LocationServices {
  getPermissionState(): StdPermissionState;
  requestPermission(): Promise<boolean>;
  acquireCoordinates(
    enableHighAccuracy: boolean,
  ): Promise<StdGeolocationCoordinates | undefined>;
}

export interface MutableLocationServices extends LocationServices {
  addPermissionRequestHandler(handler: HandlePermissionRequest): void;
  removePermissionRequestHandler(handler: HandlePermissionRequest): void;
  setPermissionState(state: StdPermissionState): void;
  watchPermission(status: StdPermissionStatus): () => void;
  setCoordinates(coords: StdGeolocationCoordinates | undefined): void;
}

export function createLocationServices({
  acquireDelay = 0,
}: { acquireDelay?: number } = {}): MutableLocationServices {
  const permissionRequestHandlers: HandlePermissionRequest[] = [];
  let permissionState: StdPermissionState = PROMPT;
  let coords: StdGeolocationCoordinates | undefined;

  return {
    addPermissionRequestHandler(handler) {
      permissionRequestHandlers.unshift(handler);
    },

    removePermissionRequestHandler(handler) {
      const index = permissionRequestHandlers.indexOf(handler);
      if (index !== -1) permissionRequestHandlers.splice(index, 1);
    },

    async requestPermission() {
      for (const handler of permissionRequestHandlers) {
        if (permissionState !== PROMPT) break;
        permissionState = await handler();
      }

      return permissionState === GRANTED;
    },

    getPermissionState() {
      return permissionState;
    },

    setPermissionState(nextState) {
      permissionState = nextState;
    },

    watchPermission(status) {
      permissionState = status.state;

      const handleChange = () => {
        permissionState = status.state;
      };
      status.addEventListener("change", handleChange);

      return () => {
        status.removeEventListener("change", handleChange);
      };
    },

    async acquireCoordinates() {
      await sleep(acquireDelay);

      return coords;
    },

    setCoordinates(nextCoords) {
      coords = nextCoords && createCoordinates(nextCoords);
    },
  };
}
