import { jest } from "@jest/globals";
import { GeolocationPositionError } from "../../src/index.js";
import {
  StdGeolocationPosition,
  StdPositionCallback,
  StdPositionErrorCallback,
} from "../../src/types/std.js";

export function expectGeolocationError(
  successCallback: jest.Mock<StdPositionCallback>,
  errorCallback: jest.Mock<StdPositionErrorCallback>,
  error: GeolocationPositionError,
): void {
  expect(successCallback).not.toHaveBeenCalled();
  expect(errorCallback).toHaveBeenCalledWith(error);
}

export function expectGeolocationSuccess(
  successCallback: jest.Mock<StdPositionCallback>,
  errorCallback: jest.Mock<StdPositionErrorCallback>,
  position: StdGeolocationPosition,
  exact: boolean = false,
): void {
  expect(errorCallback).not.toHaveBeenCalled();
  expect(successCallback).toHaveBeenCalledWith(position);

  if (exact) {
    expect(successCallback.mock.calls.map(([p]) => p)).toContain(position);
  }
}
