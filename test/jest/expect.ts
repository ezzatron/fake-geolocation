import { jest } from "@jest/globals";
import { GeolocationPositionError } from "../../src/index.js";

export function expectGeolocationError(
  successCallback: jest.Mock<PositionCallback>,
  errorCallback: jest.Mock<PositionErrorCallback>,
  error: GeolocationPositionError,
): void {
  expect(successCallback).not.toHaveBeenCalled();
  expect(errorCallback).toHaveBeenCalledWith(error);
}

export function expectGeolocationSuccess(
  successCallback: jest.Mock<PositionCallback>,
  errorCallback: jest.Mock<PositionErrorCallback>,
  position: GeolocationPosition,
  exact: boolean = false,
): void {
  expect(errorCallback).not.toHaveBeenCalled();
  expect(successCallback).toHaveBeenCalledWith(position);

  if (exact) {
    expect(successCallback.mock.calls.map(([p]) => p)).toContain(position);
  }
}
