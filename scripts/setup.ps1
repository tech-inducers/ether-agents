param(
    [string]$ProjectDir = ".",
    [string]$LogFile = "setup.log"
)

$ScriptDir = $PSScriptRoot

if ($ProjectDir -eq "." -or [string]::IsNullOrWhiteSpace($ProjectDir)) {
    $ProjectDir = $ScriptDir
} elseif (-not [System.IO.Path]::IsPathRooted($ProjectDir)) {
    $ProjectDir = Join-Path $ScriptDir $ProjectDir
}

$ProjectDir = Resolve-Path $ProjectDir
$LogFile = Join-Path $ProjectDir $LogFile

function Log {
    param([string]$Message)
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
    $entry = "$timestamp | $Message"
    Write-Host $entry
    Add-Content -Path $LogFile -Value $entry
}

Log "Starting setup script"
Log "Script location: $ScriptDir"
Log "Project directory: $ProjectDir"
Log "Log file: $LogFile"

try {
    $pythonVersion = python --version 2>&1
    Log "Python found: $pythonVersion"
} catch {
    Log "ERROR: Python not found"
    exit 1
}

$venvPath = Join-Path $ProjectDir "venv"
Log "Creating virtual environment at $venvPath"
python -m venv $venvPath 2>&1 | ForEach-Object { Log $_ }

$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
Log "Activating virtual environment"
. $activateScript

$reqFile = Join-Path $ProjectDir "requirements.txt"
if (Test-Path $reqFile) {
    Log "Installing dependencies from requirements.txt"
    pip install -r $reqFile 2>&1 | ForEach-Object { Log $_ }
} else {
    Log "ERROR: requirements.txt not found"
    Log "Run pip install manually"
    exit 1
}

Log "Setup completed"
