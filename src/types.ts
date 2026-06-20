export type NodePortProcess = {
  port: number;
  address: string;
  pid: number;
  processName: string;
  command: string | null;
  executablePath: string | null;
  parentProcessId: number | null;
  url: string;
  projectPath?: string | null;
  projectName?: string | null;
};

export type ProcessInfo = {
  pid: number;
  processName: string;
  command: string | null;
  executablePath: string | null;
  parentProcessId: number | null;
};

/** @deprecated Use ProcessInfo instead. */
export type WindowsProcess = ProcessInfo;

export type CommandResult = {
  stdout: string;
  stderr: string;
};
