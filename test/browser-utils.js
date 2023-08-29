/**
 * Retreive a position, and log the JSON representation.
 */
async function logPosition(options = {}) {
  navigator.geolocation.getCurrentPosition(
    ({
      coords: {
        latitude,
        longitude,
        accuracy,
        altitude,
        altitudeAccuracy,
        heading,
        speed,
      },
      timestamp,
    }) => {
      console.log(
        JSON.stringify({
          coords: {
            latitude,
            longitude,
            accuracy,
            altitude,
            altitudeAccuracy,
            heading,
            speed,
          },
          timestamp,
        }),
      );
    },
    (e) => {
      console.error(e);
    },
    options,
  );
}

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
