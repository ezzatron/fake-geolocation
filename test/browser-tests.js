/**
 * This test shows that if maximumAge is 0, browsers will not return a cached
 * position.
 */
async function maximumAgeAffectsCache() {
  // cache a position
  const positionA = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
    );
  });
  console.log({ positionA });

  // sleep for 1ms
  await new Promise((resolve) => {
    setTimeout(resolve, 1);
  });

  // get another position with maximumAge = 0
  const positionB = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { maximumAge: 0 },
    );
  });
  console.log({ positionB });

  // check that the second position was not cached
  if (positionB.timestamp === positionA.timestamp) {
    console.error("❌ Position was cached");
  } else {
    console.log("✅ Position was not cached");
  }
}

/**
 * This test shows that if maximumAge is Infinity, browsers will return a cached
 * position, even if timeout is 0.
 */
async function maximumAgeAffectsTimeout() {
  // cache a position
  const positionA = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
    );
  });
  console.log({ positionA });

  // sleep for 1ms
  await new Promise((resolve) => {
    setTimeout(resolve, 1);
  });

  // get another position with maximumAge = Infinity and timeout = 0
  const positionB = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { maximumAge: Infinity, timeout: 0 },
    );
  });
  console.log({ positionB });

  // check that the second position was cached
  if (positionB.timestamp === positionA.timestamp) {
    console.log("✅ Position was cached");
  } else {
    console.error("❌ Position was not cached");
  }
}

/**
 * This test shows that the timestamp of a position is based on the time when
 * getCurrentPosition was called, not when the position was received.
 */
async function timestampIsBasedOnAcquireTime() {
  // get another position, recording timestamps
  const acquireTime = Date.now();
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { maximumAge: 0 },
    );
  });
  const receiveTime = Date.now();
  console.log({ positionB: position });

  // check that the timestamp is after the acquire time
  if (position.timestamp > acquireTime) {
    console.log("✅ Timestamp is after acquire time");
  } else {
    console.error("❌ Timestamp is before acquire time");
  }

  // log the deltas between timestamps
  console.log({
    acquireDelta: position.timestamp - acquireTime,
    receiveDelta: receiveTime - acquireTime,
    deltaDelta: receiveTime - acquireTime - (position.timestamp - acquireTime),
  });
}

/**
 * This test shows that there is only one cached position, and that the cached
 * position is only used if its highAccuracy value matches
 * options.enableHighAccuracy.
 *
 * Results:
 *
 * - Firefox will use a cached high accuracy position even if you ask for a low
 *   accuracy one. It will not use a cached low accuracy position if you ask for
 *   a high accuracy one.
 * - All other browsers tested seem to completely ignore the accuracy of the
 *   cached position. You will get a cached position if there is one, regardless
 *   of the accuracy you request.
 */
async function singularCachedPosition() {
  // cache a low accuracy position
  const positionA = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { enableHighAccuracy: false },
    );
  });
  console.log({ positionA });

  // sleep for 1ms
  await new Promise((resolve) => {
    setTimeout(resolve, 1);
  });

  // get a high accuracy position with maximumAge = Infinity
  const positionB = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { enableHighAccuracy: true, maximumAge: Infinity },
    );
  });
  console.log({ positionB });

  // sleep for 1ms
  await new Promise((resolve) => {
    setTimeout(resolve, 1);
  });

  // get a low accuracy position with maximumAge = Infinity
  const positionC = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        resolve(p);
      },
      (e) => {
        reject(e);
      },
      { enableHighAccuracy: false, maximumAge: Infinity },
    );
  });
  console.log({ positionC });

  // check that the second position was not cached
  if (positionB.timestamp === positionA.timestamp) {
    console.error("❌ Position was cached");
  } else {
    console.log("✅ Position was not cached");
  }

  // check that the third position was not cached
  if (
    positionC.timestamp === positionA.timestamp ||
    positionC.timestamp === positionB.timestamp
  ) {
    console.error("❌ Position was cached");
  } else {
    console.log("✅ Position was not cached");
  }
}

async function geolocationWarming() {
  let resolveFirstPosition;
  const firstPosition = new Promise((resolve) => {
    resolveFirstPosition = resolve;
  });

  const positionsA = [];
  const positionsB = [];

  navigator.geolocation.watchPosition(
    (p) => {
      positionsA.push(p);
      resolveFirstPosition();
    },
    undefined,
    { enableHighAccuracy: true },
  );

  await firstPosition;
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });

  const startTime = Date.now();

  navigator.geolocation.getCurrentPosition(
    () => {
      console.log(
        `Cached position received by getCurrentPosition() after ${
          Date.now() - startTime
        }ms`,
      );
    },
    undefined,
    { enableHighAccuracy: true, maximumAge: Infinity },
  );

  let isSeen = false;

  navigator.geolocation.watchPosition(
    (p) => {
      if (!isSeen) {
        isSeen = true;

        console.log(
          `Cached position received by watchPosition() after ${
            Date.now() - startTime
          }ms`,
        );
      }

      console.log(`Received position is ${Date.now() - p.timestamp}ms old`);

      positionsB.push(p);
    },
    undefined,
    { enableHighAccuracy: true, maximumAge: Infinity },
  );

  // check that the positions are the same every 100ms
  const interval = setInterval(() => {
    const matches = positionsA.map((p) => {
      return positionsB.includes(p);
    });

    console.log(matches.map((m) => (m ? "✅" : "❌")).join(" "));
  }, 1000);
}
