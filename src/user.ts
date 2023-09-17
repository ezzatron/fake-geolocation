import {
  HandlePermissionRequest,
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
} from "fake-permissions";
import { MutableLocationServices } from "./location-services.js";

export interface User extends PermissionsUser {
  enableLocationServices(): void;
  disableLocationServices(): void;
  jumpToCoordinates(coords: Partial<GeolocationCoordinates>): void;
  takeJourney(journey: AsyncIterable<GeolocationCoordinates>): Promise<void>;
}

export function createUser({
  handlePermissionRequest,
  locationServices,
  lowAccuracyTransform = (coords) => coords,
  normalizeCoordinates = ({
    latitude = 0,
    longitude = 0,
    accuracy = 10,
    altitude = null,
    altitudeAccuracy = null,
    heading = null,
    speed = null,
  }) => ({
    latitude,
    longitude,
    accuracy,
    altitude,
    altitudeAccuracy,
    heading,
    speed,
  }),
  permissionStore,
}: {
  handlePermissionRequest?: HandlePermissionRequest;
  locationServices: MutableLocationServices;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  normalizeCoordinates?: (
    coords: Partial<GeolocationCoordinates>,
  ) => GeolocationCoordinates;
  permissionStore: PermissionStore;
}): User {
  return {
    ...createPermissionsUser({ permissionStore, handlePermissionRequest }),

    enableLocationServices() {
      locationServices.enable();
    },

    disableLocationServices() {
      locationServices.disable();
    },

    jumpToCoordinates(coords) {
      const normalized = normalizeCoordinates(coords);

      locationServices.setHighAccuracyCoordinates(normalized);
      locationServices.setLowAccuracyCoordinates(
        lowAccuracyTransform(normalized),
      );
    },

    async takeJourney(journey) {
      for await (const coords of journey) {
        this.jumpToCoordinates(coords);
      }
    },
  };
}
