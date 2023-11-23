export function compareCoordinates(
  a: GeolocationCoordinates,
  b: GeolocationCoordinates,
): number {
  return (
    a.latitude - b.latitude ||
    a.longitude - b.longitude ||
    (a.altitude ?? 0) - (b.altitude ?? 0) ||
    (a.heading ?? 0) - (b.heading ?? 0) ||
    (a.speed ?? 0) - (b.speed ?? 0) ||
    a.accuracy - b.accuracy ||
    (a.altitudeAccuracy ?? 0) - (b.altitudeAccuracy ?? 0) ||
    0
  );
}
