# Notable edge-cases

## Calling `watchPosition` with the `timeout` option

Browsers differ greatly in how they handle `watchPosition` calls when the
`timeout` option is set. From some quick initial testing:

- With a `timeout` of `0`:
  - Chrome (macOS/Android) will:
    - Immediately call the error callback with a timeout error
    - At some later point, call the success callback with a position
    - Continue to call both the success and error callbacks over time in an
      inscrutable order
  - Firefox (macOS) will:
    - Never call the error callback
    - Call the success callback with positions over time
  - Safari (macOS/iOS) will:
    - Immediately call the error callback with a timeout error
    - Never call the success callback
- With a `timeout` of `1` (basically, impossibly low but not zero):
  - Safari (macOS/iOS) will:
    - Immediately call the error callback with a timeout error
    - At some later point, call the success callback with a position
    - Continue to call the success callback over time
  - Other browsers will behave basically the same as with a `timeout` of `0`

For now, `fake-geolocation` will not attempt to emulate this behavior. It will
instead do what it seems like the spec intends: call the error callback every
time the `timeout` is reached, but do not stop watching for positions just
because acquiring the position timed out previously.

## Revoking and re-granting permissions while `watchPosition` is active

Browsers differ greatly in how they handle revoked/re-granted permissions during
`watchPosition` calls. From some quick initial testing, while in the middle of
an active `watchPosition` call, revoking permissions will:

- Chrome (macOS) will:
  - Immediately call the error callback with a position unavailable error,
    followed by a permission denied error
  - Never call the success callback again after re-granting permissions
- Firefox (macOS) will:
  - Not call the error callback
  - Resume calling the success callback with positions after re-granting
    permissions
- Safari (macOS) will:
  - Not call the error callback
  - Never call the success callback again after re-granting permissions
