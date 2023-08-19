import { MutableLocationServices } from "./location-services.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface User {
  jumpToCoordinates(coords: StdGeolocationCoordinates): void;
}

export function createUser({
  locationServices,
}: {
  locationServices: MutableLocationServices;
}): User {
  return {
    jumpToCoordinates(coords: StdGeolocationCoordinates) {
      locationServices.setCoordinates(coords);
    },
  };
}
