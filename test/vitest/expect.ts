import { expect, type Mock } from "vitest";

export function expectGeolocationError(
  successCallback: Mock<PositionCallback>,
  errorCallback: Mock<PositionErrorCallback>,
  error: globalThis.GeolocationPositionError,
): void {
  expect(successCallback).not.toHaveBeenCalled();
  expect(errorCallback).toHaveBeenCalledWith(error);
}

export function expectGeolocationSuccess(
  successCallback: Mock<PositionCallback>,
  errorCallback: Mock<PositionErrorCallback>,
  position: GeolocationPosition,
  exact: boolean = false,
): void {
  expect(errorCallback).not.toHaveBeenCalled();
  expect(successCallback).toHaveBeenCalledWith(position);

  if (exact) {
    expect(successCallback.mock.calls.map(([p]) => p)).toContain(position);
  }
}
