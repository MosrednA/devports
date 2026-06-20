export const LIST_NODE_PORTS_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'

$ports = @(Get-NetTCPConnection -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess)

$nodes = @(Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Select-Object ProcessId, Name, CommandLine, ExecutablePath, ParentProcessId)

$nodeByPid = @{}
foreach ($node in $nodes) {
  $nodeByPid[[int]$node.ProcessId] = $node
}

$result = foreach ($port in $ports) {
  $node = $nodeByPid[[int]$port.OwningProcess]
  if ($null -ne $node) {
    [PSCustomObject]@{
      port = [int]$port.LocalPort
      address = [string]$port.LocalAddress
      pid = [int]$port.OwningProcess
      processName = [string]$node.Name
      command = $node.CommandLine
      executablePath = $node.ExecutablePath
      parentProcessId = [int]$node.ParentProcessId
    }
  }
}

@($result) | ConvertTo-Json -Depth 4 -Compress
`.trim();

export function getProcessByPidScript(pid: number): string {
  return String.raw`
$ErrorActionPreference = 'Stop'
$process = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" |
  Select-Object -First 1 ProcessId, Name, CommandLine, ExecutablePath, ParentProcessId

if ($null -ne $process) {
  [PSCustomObject]@{
    pid = [int]$process.ProcessId
    processName = [string]$process.Name
    command = $process.CommandLine
    executablePath = $process.ExecutablePath
    parentProcessId = [int]$process.ParentProcessId
  } | ConvertTo-Json -Depth 3 -Compress
}
`.trim();
}
