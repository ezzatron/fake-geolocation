import { expect, type Mock } from "vitest";

export function expectGeolocationError(
  successCallback: Mock<PositionCallback>,
  errorCallback: Mock<PositionErrorCallback>,
  error: globalThis.GeolocationPositionError,
): void {
  expect(successCallback).not.toBeCalled();
  expect(errorCallback).toBeCalledWith(error);
}

export function expectGeolocationSuccess(
  successCallback: Mock<PositionCallback>,
  errorCallback: Mock<PositionErrorCallback>,
  position: GeolocationPosition,
  exact: boolean = false,
): void {
  expect(errorCallback).not.toBeCalled();
  expect(successCallback).toBeCalledWith(position);

  if (exact) {
    expect(successCallback.mock.calls.map(([p]) => p)).toContain(position);
  }
}
