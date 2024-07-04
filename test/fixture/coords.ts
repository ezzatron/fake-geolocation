import { createCoordinates } from "fake-geolocation";

export const coordsA: GeolocationCoordinates = createCoordinates({
  latitude: 40.71703581534977,
  longitude: -74.03457283319447,
  altitude: 22.27227783203125,
  accuracy: 25.019,
  altitudeAccuracy: 9.838127136230469,
  heading: null,
  speed: null,
});

export const coordsB: GeolocationCoordinates = createCoordinates({
  latitude: 12,
  longitude: 34,
  altitude: 78,
  accuracy: 56,
  altitudeAccuracy: 9,
  heading: null,
  speed: null,
});

export const coordsC: GeolocationCoordinates = createCoordinates({
  latitude: 98,
  longitude: 76,
  altitude: 32,
  accuracy: 54,
  altitudeAccuracy: 10,
  heading: null,
  speed: null,
});

export const coordsD: GeolocationCoordinates = createCoordinates({
  latitude: 23,
  longitude: 45,
  altitude: 89,
  accuracy: 67,
  altitudeAccuracy: 10,
  heading: null,
  speed: null,
});
