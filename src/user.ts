import { DENIED, GRANTED, PROMPT } from "./constants/permission-state.js";
import { HandlePermissionRequest } from "./handle-permission-request.js";
import { MutableLocationServices } from "./location-services.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface User {
  grantGeolocationPermission(): void;
  denyGeolocationPermission(): void;
  resetGeolocationPermission(): void;
  requestGeolocationPermission(): Promise<void>;
  jumpToCoordinates(coords: StdGeolocationCoordinates): void;
}

export function createUser({
  locationServices,
  handlePermissionRequest,
}: {
  locationServices: MutableLocationServices;
  handlePermissionRequest?: HandlePermissionRequest;
}): User {
  locationServices.addPermissionRequestHandler(async () => {
    return handlePermissionRequest ? handlePermissionRequest() : DENIED;
  });

  return {
    grantGeolocationPermission() {
      locationServices.setPermissionState(GRANTED);
    },

    denyGeolocationPermission() {
      locationServices.setPermissionState(DENIED);
    },

    resetGeolocationPermission() {
      locationServices.setPermissionState(PROMPT);
    },

    async requestGeolocationPermission() {
      await locationServices.requestPermission();
    },

    jumpToCoordinates(coords: StdGeolocationCoordinates) {
      locationServices.setPosition({ coords, timestamp: Date.now() });
    },
  };
}
