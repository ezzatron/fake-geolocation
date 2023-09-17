export interface Journey {
  readonly startTime: number;
  readonly endTime: number;
  nextStopTime(time: number): number;
  previousStopTime(time: number): number;
  coordsAtTime(time: number): GeolocationCoordinates;
}

export function createJourneyFromStops(stops: GeolocationPosition[]): Journey {
  if (stops.length < 1) throw new TypeError("No stops provided");

  const sortedStops = [...stops].sort(
    ({ timestamp: a }, { timestamp: b }) => a - b,
  );
  const reverseSortedStops = [...stops].reverse();
  const firstStop = sortedStops[0];
  const lastStop = sortedStops[sortedStops.length - 1];

  return {
    get startTime() {
      return firstStop.timestamp;
    },

    get endTime() {
      return lastStop.timestamp;
    },

    nextStopTime(time) {
      const stop = sortedStops.find((stop) => stop.timestamp > time);

      return stop ? stop.timestamp : NaN;
    },

    previousStopTime(time) {
      const stop = reverseSortedStops.find((stop) => stop.timestamp < time);

      return stop ? stop.timestamp : NaN;
    },

    coordsAtTime(time) {
      const prevStop = reverseSortedStops.find((stop) => stop.timestamp < time);
      const nextStop = sortedStops.find((stop) => stop.timestamp > time);

      if (!prevStop) return firstStop.coords;
      if (!nextStop) return lastStop.coords;

      const stopDuration = nextStop.timestamp - prevStop.timestamp;
      const elapsedTime = time - prevStop.timestamp;
      const progress = elapsedTime / stopDuration;

      const {
        latitude: prevLatitude,
        longitude: prevLongitude,
        accuracy: prevAccuracy,
        altitude: prevAltitude,
        altitudeAccuracy: prevAltitudeAccuracy,
        heading: prevHeading,
        speed: prevSpeed,
      } = prevStop.coords;

      const {
        latitude: nextLatitude,
        longitude: nextLongitude,
        accuracy: nextAccuracy,
        altitude: nextAltitude,
        altitudeAccuracy: nextAltitudeAccuracy,
        heading: nextHeading,
        speed: nextSpeed,
      } = nextStop.coords;

      const speed =
        prevSpeed && nextSpeed
          ? lerp(prevSpeed, nextSpeed, progress)
          : prevSpeed;

      return {
        latitude: lerp(prevLatitude, nextLatitude, progress),
        longitude: lerp(prevLongitude, nextLongitude, progress),
        accuracy: lerp(prevAccuracy, nextAccuracy, progress),
        altitude:
          prevAltitude && nextAltitude
            ? lerp(prevAltitude, nextAltitude, progress)
            : prevAltitude,
        altitudeAccuracy:
          prevAltitudeAccuracy && nextAltitudeAccuracy
            ? lerp(prevAltitudeAccuracy, nextAltitudeAccuracy, progress)
            : prevAltitudeAccuracy,
        heading:
          speed === 0
            ? NaN
            : prevHeading && nextHeading
            ? lerp(prevHeading, nextHeading, progress)
            : prevHeading,
        speed,
      };
    },
  };
}

function lerp(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}
