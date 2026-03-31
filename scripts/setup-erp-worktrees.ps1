param(
    [ValidateSet("Full12", "Overnight6")]
    [string]$Preset = "Full12",
    [string]$ClientRepo,
    [string]$ServerRepo,
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

$scriptRepoRoot = [string](Resolve-Path (Join-Path $PSScriptRoot ".."))
$workspaceRoot = [string](Resolve-Path (Join-Path $scriptRepoRoot ".."))

if (-not $ClientRepo) {
    $ClientRepo = $scriptRepoRoot
}

if (-not $ServerRepo) {
    $ServerRepo = Join-Path $workspaceRoot "server"
}

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $workspaceRoot "worktrees"
}

function Assert-GitRepo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoPath
    )

    if (-not (Test-Path -LiteralPath $RepoPath -PathType Container)) {
        throw "Missing repo path: $RepoPath"
    }

    $gitDir = Join-Path $RepoPath ".git"
    if (-not (Test-Path -LiteralPath $gitDir)) {
        throw "Not a git repo: $RepoPath"
    }
}

function Get-SessionSpec {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PresetName,
        [Parameter(Mandatory = $true)]
        [string]$ClientPath,
        [Parameter(Mandatory = $true)]
        [string]$ServerPath
    )

    if ($PresetName -eq "Full12") {
        return @(
            [pscustomobject]@{ Session = "1"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-01-docs-gap-analysis"; Worktree = "hanjongan-s01-docs"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "2"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-02-worker-entry"; Worktree = "hanjongan-s02-worker-entry"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "3"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-03-report-authoring"; Worktree = "hanjongan-s03-report-authoring"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "4"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-04-admin-kpi"; Worktree = "hanjongan-s04-admin-kpi"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "5"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-05-cache-loading"; Worktree = "hanjongan-s05-cache-loading"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "6"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-06-smoke"; Worktree = "hanjongan-s06-smoke"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "7"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-07-benchmark"; Worktree = "hanjongan-s07-benchmark"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "8"; Repo = "server"; RepoPath = $ServerPath; Branch = "erp/session-08-api-audit"; Worktree = "server-s08-api-audit"; LinkNodeModules = $false; LinkVenv = $true; CopyEnvLocal = $false; CopyDotEnv = $true },
            [pscustomobject]@{ Session = "9"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-09-merge"; Worktree = "hanjongan-s09-merge"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "10"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-10-microcopy"; Worktree = "hanjongan-s10-microcopy"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "11"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-11-ux-a11y"; Worktree = "hanjongan-s11-ux-a11y"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
            [pscustomobject]@{ Session = "12"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/session-12-qa-docs"; Worktree = "hanjongan-s12-qa-docs"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false }
        )
    }

    return @(
        [pscustomobject]@{ Session = "A"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-a-docs-suite"; Worktree = "hanjongan-night-a-docs"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
        [pscustomobject]@{ Session = "B"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-b-worker-entry"; Worktree = "hanjongan-night-b-worker-entry"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
        [pscustomobject]@{ Session = "C"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-c-report-authoring"; Worktree = "hanjongan-night-c-reports"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
        [pscustomobject]@{ Session = "D"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-d-admin-overview"; Worktree = "hanjongan-night-d-admin"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
        [pscustomobject]@{ Session = "E-client"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-e-stability-client"; Worktree = "hanjongan-night-e-client"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false },
        [pscustomobject]@{ Session = "E-server"; Repo = "server"; RepoPath = $ServerPath; Branch = "erp/night-e-stability-api"; Worktree = "server-night-e-api"; LinkNodeModules = $false; LinkVenv = $true; CopyEnvLocal = $false; CopyDotEnv = $true },
        [pscustomobject]@{ Session = "F"; Repo = "client"; RepoPath = $ClientPath; Branch = "erp/night-f-merge-smoke"; Worktree = "hanjongan-night-f-merge"; LinkNodeModules = $true; LinkVenv = $false; CopyEnvLocal = $true; CopyDotEnv = $false }
    )
}

function Ensure-Worktree {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Spec,
        [Parameter(Mandatory = $true)]
        [string]$RootPath
    )

    $worktreePath = Join-Path $RootPath $Spec.Worktree
    $branchLookup = @(& git -C $Spec.RepoPath branch --list $Spec.Branch 2>$null)
    $branchExists = ($branchLookup -join "").Trim().Length -gt 0

    if (Test-Path -LiteralPath $worktreePath) {
        Write-Host "[skip] $($Spec.Session) already exists at $worktreePath"
        return $worktreePath
    }

    if ($branchExists) {
        & git -C $Spec.RepoPath worktree add $worktreePath $Spec.Branch | Out-Null
    } else {
        & git -C $Spec.RepoPath worktree add -b $Spec.Branch $worktreePath HEAD | Out-Null
    }

    return $worktreePath
}

function Ensure-Junction {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$TargetPath
    )

    if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
        return
    }

    if (Test-Path -LiteralPath $TargetPath) {
        return
    }

    New-Item -ItemType Junction -Path $TargetPath -Target $SourcePath | Out-Null
}

function Copy-IfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceFile,
        [Parameter(Mandatory = $true)]
        [string]$TargetFile
    )

    if (-not (Test-Path -LiteralPath $SourceFile -PathType Leaf)) {
        return
    }

    if (Test-Path -LiteralPath $TargetFile) {
        return
    }

    Copy-Item -LiteralPath $SourceFile -Destination $TargetFile
}

Assert-GitRepo -RepoPath $ClientRepo
Assert-GitRepo -RepoPath $ServerRepo

if (-not (Test-Path -LiteralPath $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot | Out-Null
}

$sessionSpecs = Get-SessionSpec -PresetName $Preset -ClientPath $ClientRepo -ServerPath $ServerRepo
$created = @()

foreach ($spec in $sessionSpecs) {
    $worktreePath = Ensure-Worktree -Spec $spec -RootPath $OutputRoot

    if ($spec.LinkNodeModules) {
        Ensure-Junction -SourcePath (Join-Path $spec.RepoPath "node_modules") -TargetPath (Join-Path $worktreePath "node_modules")
    }

    if ($spec.LinkVenv) {
        Ensure-Junction -SourcePath (Join-Path $spec.RepoPath ".venv") -TargetPath (Join-Path $worktreePath ".venv")
    }

    if ($spec.CopyEnvLocal) {
        Copy-IfMissing -SourceFile (Join-Path $spec.RepoPath ".env.local") -TargetFile (Join-Path $worktreePath ".env.local")
    }

    if ($spec.CopyDotEnv) {
        Copy-IfMissing -SourceFile (Join-Path $spec.RepoPath ".env") -TargetFile (Join-Path $worktreePath ".env")
    }

    $created += [pscustomobject]@{
        Session = $spec.Session
        Repo = $spec.Repo
        Branch = $spec.Branch
        Worktree = $worktreePath
    }
}

Write-Host ""
Write-Host "Prepared preset: $Preset"
$created | Format-Table -AutoSize
