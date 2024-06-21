import { expect } from "vitest";
import type { Mocked } from "../helpers.js";

export function expectGeolocationError(
  successCallback: Mocked<PositionCallback>,
  errorCallback: Mocked<PositionErrorCallback>,
  error: globalThis.GeolocationPositionError,
): void {
  expect(successCallback).not.toHaveBeenCalled();
  expect(errorCallback).toHaveBeenCalledWith(error);
}

export function expectGeolocationSuccess(
  successCallback: Mocked<PositionCallback>,
  errorCallback: Mocked<PositionErrorCallback>,
  position: GeolocationPosition,
  exact: boolean = false,
): void {
  expect(errorCallback).not.toHaveBeenCalled();
  expect(successCallback).toHaveBeenCalledWith(position);

  if (exact) {
    expect(successCallback.mock.calls.map(([p]) => p)).toContain(position);
  }
}
