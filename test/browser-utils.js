/**
 * Log a position.
 */
function logPosition(
  {
    coords: {
      latitude,
      longitude,
      altitude,
      accuracy,
      altitudeAccuracy,
      heading,
      speed,
    },
    timestamp,
  },
  label = "logPosition",
) {
  console.log(
    label,
    JSON.stringify({
      coords: {
        latitude,
        longitude,
        altitude,
        accuracy,
        altitudeAccuracy,
        heading,
        speed,
      },
      timestamp,
    }),
  );
}

/**
 * Retreive a position, and log the JSON representation.
 */
navigator.geolocation.getCurrentPosition(
  (p) => {
    logPosition(p, "getCurrentPosition");
  },
  (e) => {
    console.error(e);
  },
);

/**
 * Watch a position, and log the JSON representation.
 */
let watchId = navigator.geolocation.watchPosition(
  (p) => {
    logPosition(p, "watchPosition");
  },
  (e) => {
    console.error(e);
  },
);

/**
 * Clear the watch.
 */
navigator.geolocation.clearWatch(watchId);

/**
 * Output the average accuracy of positions over time, until cancelled.
 */
function logAverageAccuracy(enableHighAccuracy = false) {
  let count = 0;
  let total = 0;

  const interval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { accuracy } }) => {
        ++count;
        total += accuracy;

        console.log(total / count);
      },
      (e) => {
        console.error(e);
      },
      { enableHighAccuracy },
    );
  }, 1000);

  return () => {
    clearInterval(interval);
  };
}
