import type { ShellStatus } from "../_types/shell.types";
import { SHELL_STATUS_MOCK } from "./shell.mock";

export const fetchShellStatusApi = async (): Promise<ShellStatus> => SHELL_STATUS_MOCK;
