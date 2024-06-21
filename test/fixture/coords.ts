export const coordsA: GeolocationCoordinatesWithToStringTag = {
  latitude: 40.71703581534977,
  longitude: -74.03457283319447,
  accuracy: 25.019,
  altitude: 22.27227783203125,
  altitudeAccuracy: 9.838127136230469,
  heading: null,
  speed: null,
  [Symbol.toStringTag]: "GeolocationCoordinates",
};

export const coordsB: GeolocationCoordinatesWithToStringTag = {
  latitude: 12,
  longitude: 34,
  accuracy: 56,
  altitude: 78,
  altitudeAccuracy: 9,
  heading: null,
  speed: null,
  [Symbol.toStringTag]: "GeolocationCoordinates",
};

export const coordsC: GeolocationCoordinatesWithToStringTag = {
  latitude: 98,
  longitude: 76,
  accuracy: 54,
  altitude: 32,
  altitudeAccuracy: 10,
  heading: null,
  speed: null,
  [Symbol.toStringTag]: "GeolocationCoordinates",
};

export const coordsD: GeolocationCoordinatesWithToStringTag = {
  latitude: 23,
  longitude: 45,
  accuracy: 67,
  altitude: 89,
  altitudeAccuracy: 10,
  heading: null,
  speed: null,
  [Symbol.toStringTag]: "GeolocationCoordinates",
};

type GeolocationCoordinatesWithToStringTag = GeolocationCoordinates & {
  [Symbol.toStringTag]: string;
};
