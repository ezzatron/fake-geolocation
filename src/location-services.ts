import { sleep } from "./async.js";
import { GRANTED, PROMPT } from "./constants/permission-state.js";
import { createPositionUnavailableError } from "./geolocation-position-error.js";
import { createPosition } from "./geolocation-position.js";
import { HandlePermissionRequest } from "./handle-permission-request.js";
import {
  StdGeolocationPosition,
  StdPermissionState,
  StdPermissionStatus,
} from "./types/std.js";

export interface LocationServices {
  getPermissionState(): StdPermissionState;
  requestPermission(): Promise<boolean>;
  getPosition(): Promise<StdGeolocationPosition>;
}

export interface MutableLocationServices extends LocationServices {
  addPermissionRequestHandler(handler: HandlePermissionRequest): void;
  removePermissionRequestHandler(handler: HandlePermissionRequest): void;
  setPermissionState(state: StdPermissionState): void;
  watchPermission(status: StdPermissionStatus): () => void;
  setPosition(position: StdGeolocationPosition | undefined): void;
}

export function createLocationServices(): MutableLocationServices {
  const permissionRequestHandlers: HandlePermissionRequest[] = [];
  let permissionState: StdPermissionState = PROMPT;
  let position: StdGeolocationPosition | undefined;

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

    async getPosition() {
      // systems should not rely on the position being available immediately
      await sleep(0);

      if (position) return position;
      throw createPositionUnavailableError("");
    },

    setPosition(nextPosition) {
      position = nextPosition && createPosition(nextPosition);
    },
  };
}
