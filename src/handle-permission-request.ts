import { SyncOrAsync } from "./async.js";
import { StdPermissionState } from "./types/std.js";

export type HandlePermissionRequest = () => SyncOrAsync<StdPermissionState>;
