# ===========================================================================================
#  Esquire Haubergeon -- PERFORMANCE MATRIX
#
#  Drives super-load across every deployment shape and writes one CSV you can compare.
#
#      docker  x1  o11y OFF / ON
#      k8s     x1  o11y OFF / ON
#      k8s     x2  o11y OFF / ON
#
#  Each CONFIG is run TWICE, each run FROM SCRATCH, each run driving several back-to-back loads.
#
#  Entry point: perf-matrix.bat   (launches this detached so a long matrix survives the console)
#
# -------------------------------------------------------------------------------------------
#  WHY IT IS SHAPED THIS WAY -- every rule below was paid for with a wrong answer.
#
#  FROM SCRATCH, INCLUDING THE DATA.  A run tears the environment down and rebuilds it, and that
#  MUST drop the Postgres + KeyCloak + broker state. k8s-down.bat does NOT delete the PVCs and
#  `docker compose down` does not drop the volume, so a naive down/up silently keeps the old
#  database -- and the audit rows and deleted entities that accumulate there dragged throughput
#  down ~8% per run. With the data wiped, repeat runs agree to ~1-2%; without it, they drifted by
#  13-17% and NO effect smaller than that could be seen at all.
#
#  TWO RUNS PER CONFIG = THE NOISE FLOOR.  The gap between a config's own two from-scratch runs is
#  the smallest difference this rig can honestly resolve. Any config-to-config difference smaller
#  than that is not a finding. (An earlier A/B "showed" a 13% observability cost that turned out
#  to be nothing but run ordering.) Report the noise next to every conclusion.
#
#  DISCARD LOAD 1.  The first load after a rebuild is warm-up -- cold JIT, empty caches, cold
#  pools. It runs 35-45% below steady state, every single time. It is not a baseline and it is not
#  degradation; averaging it in poisons the number. Steady state = loads 2..N.
#
#  ADAPTIVE LOAD COUNT.  4 loads minimum, but keep going while the last load is still CLIMBING
#  more than $ClimbPct on the previous -- a rising last load means the fleet has not finished
#  warming (x2 has twice the JVMs to JIT), and averaging a climb UNDERSTATES the config. Capped at
#  $MaxLoads; hitting the cap while still climbing is logged loudly, because it means steady state
#  was never reached and the number is not trustworthy.
#
#  OFF MEANS OFF.  k8s-up.bat installs the observability viewing stack as part of a normal bring-up,
#  so "o11y OFF" is NOT off unless o11y-off.bat uninstalls it. Leave it running and the ON-vs-OFF
#  delta prices only the in-process half of the bill. (On k8s the collectors alone cost ~8%.)
#
#  STRICTLY SEQUENTIAL -- ONE STACK AT A TIME.  The only parallelism permitted in the whole matrix
#  is Gatling's virtual users. Running docker and k8s together on one machine is what invalidated
#  an entire first day of measurements: docker looked 5x slower purely because the cluster was
#  sharing the box.
#
#  RESUMABLE.  Results are appended after EVERY load, and a run already present in the CSV is
#  skipped. A matrix takes hours; an interruption at run 11 must not cost runs 1-10.
# ===========================================================================================

param(
    [string] $OutDir     = "$PSScriptRoot\output\perf-matrix",
    [int]    $Duration   = 120,      # seconds per load
    [int]    $MinLoads   = 4,
    [int]    $MaxLoads   = 6,
    [double] $ClimbPct   = 3.0,      # extend while the last load is >this% above the previous
    [int]    $Runs       = 2,        # runs per config (2 = the noise floor)
    [switch] $Fresh                  # start a new CSV instead of resuming the existing one
)

$ErrorActionPreference = "Continue"
$SVCS    = "C:\MyProjects\esquire\services"
$HAUBERK = $PSScriptRoot
$APPS    = @("gateway","biztree","enyman","pacman","keysmith","kcmaster","aukeep","backend")

# The super-puper load: 200 virtual users across the five scenarios.
$LOAD = @("--duration","$Duration","--read","64","--update","32","--create","32","--move","8","--tx","64")

# The matrix. Order groups k8s first so docker only needs the cluster torn down once.
$CONFIGS = @(
    @{ name = "k8s-x1-OFF";  target = "k8s";    reps = 1; o11y = "OFF" },
    @{ name = "k8s-x1-ON";   target = "k8s";    reps = 1; o11y = "ON"  },
    @{ name = "k8s-x2-OFF";  target = "k8s";    reps = 2; o11y = "OFF" },
    @{ name = "k8s-x2-ON";   target = "k8s";    reps = 2; o11y = "ON"  },
    @{ name = "docker-OFF";  target = "docker"; reps = 1; o11y = "OFF" },
    @{ name = "docker-ON";   target = "docker"; reps = 1; o11y = "ON"  }
)

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$CSV = "$OutDir\matrix.csv"
$LOG = "$OutDir\matrix.log"
if ($Fresh) { Remove-Item $CSV,$LOG -ErrorAction SilentlyContinue }
if (-not (Test-Path $CSV)) {
    "run,config,target,replicas,o11y,load,requests,ok,ko,ko_pct,rps,mean_ms,p50_ms,p75_ms,p95_ms,p99_ms,max_ms" |
        Out-File -FilePath $CSV -Encoding utf8
}

function Log($m) {
    $line = "[$((Get-Date).ToString('HH:mm:ss'))] $m"
    $line | Out-File -FilePath $LOG -Encoding utf8 -Append
    # Write-HOST, not Write-Output. Write-Output puts the line on the PIPELINE, so any function that
    # calls Log AND returns a value returns BOTH -- the caller then gets @("[12:33] load 4 ...", 1080)
    # and the arithmetic on it blows up ("Cannot convert ... to System.Double"). That silently killed
    # the adaptive load extension: the climb check threw, so no run ever extended past MinLoads.
    Write-Host $line
}

# ---- parse one Gatling global-stats block ------------------------------------------------
function Save-Result($out, $run, $cfg, $loadNo) {
    $hit = @($out | Select-String "request count")
    if ($hit.Count -eq 0) { Log "    !! NO STATS (run $run load $loadNo) -- did the token fetch fail?"; return $null }
    $all   = [regex]::Matches($hit[0].ToString(), '\|\s*([\d,\-]+)')
    $total = [double](($all[0].Groups[1].Value) -replace ',','')
    $ok    = if ($all.Count -gt 1) { ($all[1].Groups[1].Value) -replace ',','' } else { "" }
    $ko    = if ($all.Count -gt 2) { ($all[2].Groups[1].Value) -replace ',','' } else { "0" }
    function Col($pat) {
        $m = @($out | Select-String $pat)
        if ($m.Count -eq 0) { return "" }
        $c = [regex]::Matches($m[0].ToString(), '\|\s*([\d,\-]+)')
        if ($c.Count -lt 1) { return "" }
        return ($c[0].Groups[1].Value) -replace ',',''
    }
    $rps   = [math]::Round($total / $Duration, 1)
    $koPct = if ($total -gt 0) { [math]::Round(100.0 * [double]$ko / $total, 3) } else { 0 }
    "$run,$($cfg.name),$($cfg.target),$($cfg.reps),$($cfg.o11y),$loadNo,$total,$ok,$ko,$koPct,$rps,$(Col 'mean response time'),$(Col '50th percentile'),$(Col '75th percentile'),$(Col '95th percentile'),$(Col '99th percentile'),$(Col 'max response time')" |
        Out-File -FilePath $CSV -Encoding utf8 -Append
    Log "    load $loadNo : $total req, $rps rps, p99=$(Col '99th percentile')ms, KO $ko ($koPct%)"
    return $rps
}

function Wait-K8sPods {
    for ($i = 0; $i -lt 200; $i++) {
        $all = @(kubectl get pods --no-headers 2>$null | Select-String "^esquire-")
        $bad = @($all | Select-String -NotMatch "1/1\s+Running")
        if ($all.Count -gt 0 -and $bad.Count -eq 0) { return }
        Start-Sleep -Seconds 10
    }
    Log "    !! pods never all became Ready"
}

function Wait-Url($url, $tries = 90) {
    for ($i = 0; $i -lt $tries; $i++) {
        try { Invoke-WebRequest -Uri $url -TimeoutSec 4 -UseBasicParsing | Out-Null; return $true }
        catch { Start-Sleep -Seconds 10 }
    }
    return $false
}

# ---- build a k8s environment FROM SCRATCH -------------------------------------------------
function Build-K8s($cfg) {
    Set-Location "$SVCS\k8s"
    Log "  tearing k8s down"
    & ".\k8s-down.bat" *> $null
    for ($i = 0; $i -lt 60; $i++) {
        if (@(kubectl get pods --no-headers 2>$null | Select-String "^esquire-").Count -eq 0) { break }
        Start-Sleep -Seconds 5
    }
    # k8s-down.bat leaves the PVCs. Without this the "from scratch" run keeps the old database.
    Log "  dropping PVCs (Postgres + KeyCloak + broker store)"
    kubectl delete pvc postgres-data-esquire-infra-postgres-0     --ignore-not-found *> $null
    kubectl delete pvc keycloak-data-esquire-infra-kc-keycloak-0  --ignore-not-found *> $null
    kubectl delete pvc activemq-data-esquire-infra-amq-activemq-0 --ignore-not-found *> $null

    Log "  bringing k8s up (fresh PG seed + KC realm import)"
    & ".\k8s-up.bat" *> $null
    Wait-K8sPods

    # k8s-up installs the viewing stack, so OFF must explicitly uninstall it.
    if ($cfg.o11y -eq "ON") { Log "  o11y ON  (viewing stack + app instrumentation)"; & ".\o11y-on.bat"  *> $null }
    else                    { Log "  o11y OFF (uninstalling viewing stack + app instrumentation)"; & ".\o11y-off.bat" *> $null }
    Wait-K8sPods

    if ($cfg.reps -eq 1) {
        Log "  scaling to x1"
        foreach ($s in $APPS) { kubectl scale sts "esquire-$s-$s" --replicas=1 *> $null }
        Start-Sleep -Seconds 20
        Wait-K8sPods
    }
    # Both endpoints are ingress-fronted -- no port-forward, which would be a single-threaded proxy
    # AND would die on every KeyCloak rollout, leaving the run with no token and no stats.
    if (-not (Wait-Url "http://esquire.localhost/kc-auth/realms/esquire")) { Log "  !! realm never imported"; return $false }
    if (-not (Wait-Url "http://api.esquire.localhost/actuator/health"))    { Log "  !! gateway never came UP"; return $false }
    Log "  k8s ready (x$($cfg.reps), o11y=$($cfg.o11y))"
    return $true
}

# ---- build a docker environment FROM SCRATCH ----------------------------------------------
function Build-Docker($cfg) {
    Set-Location "$SVCS\compose"
    Log "  tearing docker down (-v drops the Postgres volume)"
    docker compose --profile o11y down -v *> $null
    if (Test-Path "$SVCS\compose\data\keycloak") {
        Remove-Item "$SVCS\compose\data\keycloak" -Recurse -Force -ErrorAction SilentlyContinue
    }
    if ($cfg.o11y -eq "ON") { $env:ESQ_OBSERVABILITY_ENABLED="true";  $env:ESQ_METRICS_HISTOGRAMS="true" }
    else                    { $env:ESQ_OBSERVABILITY_ENABLED="false"; $env:ESQ_METRICS_HISTOGRAMS="false" }
    Log "  bringing docker up (fresh PG seed + KC realm import), o11y=$($cfg.o11y)"
    docker compose up -d *> $null
    if ($cfg.o11y -eq "ON") { & ".\o11y-on.bat" *> $null }

    # The gateway's health is NOT a readiness gate for the STACK. It comes up in ~10s without
    # touching Postgres, so a database that failed to seed leaves the gateway happily reporting UP
    # while every load then returns no stats at all. (That is exactly what happened: the postgres
    # image had a CRLF init.sh, initdb died, and this gate said "ready" four runs in a row.)
    # Gate on the three things a run actually needs: the DB SEEDED, the realm IMPORTED, the gateway UP.
    $ok = $false
    for ($i = 0; $i -lt 90; $i++) {
        try {
            $orgs = (docker exec esq-postgres psql -U esq2025 -d esq2025 -t -A -c "select count(*) from esq_org;" 2>$null)
            if ([int]$orgs -gt 0) {
                if ((Invoke-RestMethod -Uri "http://localhost:7070/actuator/health" -TimeoutSec 4).status -eq "UP") {
                    Invoke-WebRequest -Uri "http://localhost:8081/kc-auth/realms/esquire" -TimeoutSec 4 -UseBasicParsing | Out-Null
                    $ok = $true; break
                }
            }
        } catch { }
        Start-Sleep -Seconds 10
    }
    if (-not $ok) { Log "  !! docker never became usable (DB seeded? realm imported? gateway UP?)"; return $false }
    Log "  docker ready (o11y=$($cfg.o11y)) -- DB seeded, realm imported, gateway UP"
    return $true
}

# ---- one run: build from scratch -> prepare -> loads until steady --------------------------
function Invoke-Run($run, $cfg) {
    if (Test-Path $CSV) {
        $done = @(Import-Csv $CSV | Where-Object { $_.run -eq "$run" }).Count
        if ($done -ge $MinLoads) { Log "======== RUN $run : $($cfg.name) -- already complete, skipping ========"; return }
        if ($done -gt 0) {
            @(Import-Csv $CSV | Where-Object { $_.run -ne "$run" }) | Export-Csv -Path $CSV -NoTypeInformation -Encoding utf8
            Log "  (discarded $done rows from an interrupted run $run)"
        }
    }
    Log "======== RUN $run : $($cfg.name)  (from scratch) ========"
    if ($cfg.target -eq "k8s") {
        if (-not (Build-K8s $cfg)) { Log "  ABORTING run $run"; return }
        $hcfg = @("--config","hauberk-k8s.properties")
    } else {
        if (-not (Build-Docker $cfg)) { Log "  ABORTING run $run"; return }
        $hcfg = @()
    }

    Set-Location $HAUBERK
    # CHECK the prepare. It used to be fire-and-forget, and "playground prepared" was logged whether or
    # not it worked -- so a broken environment produced four NO-STATS loads instead of one clear abort.
    # If the playground is not there, no load can mean anything; stop the run here and say why.
    $prep = & .\hauberk.cmd run prepare-for-anything @hcfg --prep-depth 5 --prep-clients 5 --prep-accounts 2 2>&1
    $prepReq = @($prep | Select-String "request count")
    if ($prepReq.Count -eq 0) {
        Log "  !! PLAYGROUND PREPARE PRODUCED NO REQUESTS -- the environment is not usable (token? gateway? seeded DB?)"
        Log "  ABORTING run $run"
        return
    }
    Log "  playground prepared; loads (min $MinLoads, extend while climbing >$ClimbPct%, max $MaxLoads):"

    $rps = @()
    for ($i = 1; $i -le $MaxLoads; $i++) {
        $out = & .\hauberk.cmd run super-load @hcfg @LOAD 2>&1
        # Belt and braces: take only the LAST value the function emits, and force it to a double, so a
        # stray pipeline write can never turn the climb check into string arithmetic again.
        $r = @(Save-Result $out $run $cfg $i)[-1]
        if ($null -ne $r -and $r -match '^\d+(\.\d+)?$') { $rps += [double]$r }
        if ($i -ge $MinLoads -and $rps.Count -ge 2) {
            $climb = 100.0 * ($rps[-1] - $rps[-2]) / $rps[-2]
            if ($climb -le $ClimbPct) { Log "    settled ($([math]::Round($climb,1))% vs previous) -- $i loads"; break }
            Log "    still climbing (+$([math]::Round($climb,1))%) -- extending"
            if ($i -eq $MaxLoads) { Log "    !! hit the $MaxLoads-load cap WHILE STILL CLIMBING -- steady state not reached, treat this config's number as a floor" }
        }
    }
}

# ---- the matrix ---------------------------------------------------------------------------
Log "############ PERF MATRIX START ($($CONFIGS.Count) configs x $Runs runs) ############"
Log "### docker down -- the k8s half must have the machine to itself"
Set-Location "$SVCS\compose"; docker compose --profile o11y down -v *> $null

$run = 0
foreach ($cfg in $CONFIGS) {
    if ($cfg.target -eq "docker" -and -not $script:k8sDrained) {
        # k8s-down.bat is NOT a full teardown. It uninstalls the app releases and esquire-infra, but NOT the
        # observability releases that o11y-on.bat installs separately (loki / alloy / tempo / otel-collector /
        # prometheus / grafana / postgres-exporter), nor kafka / redis / topology. NINE pods survive it --
        # including the entire k8s collector stack -- and they then compete with docker for the same cores.
        # That is the co-tenancy that has already invalidated two sets of docker numbers.
        # So: uninstall EVERY esquire release, and REFUSE TO CONTINUE if anything is still standing. A drain
        # that cannot prove itself must abort, not log "drained" and carry on measuring a contaminated box.
        Log "### tearing k8s FULLY down -- docker must have the machine to itself"
        Set-Location "$SVCS\k8s"
        foreach ($rel in (helm list --short 2>$null)) { helm uninstall $rel *> $null }
        for ($i = 0; $i -lt 60; $i++) {
            if (@(kubectl get pods --no-headers 2>$null | Select-String "^esquire-").Count -eq 0) { break }
            Start-Sleep -Seconds 5
        }
        $left = @(kubectl get pods --no-headers 2>$null | Select-String "^esquire-").Count
        if ($left -gt 0) {
            Log "### !! $left k8s pods SURVIVED the teardown -- docker would be measured on a shared box."
            Log "### !! ABORTING the docker half. Drain the cluster by hand and rerun."
            throw "k8s not drained ($left pods still up)"
        }
        $script:k8sDrained = $true
        Log "### k8s drained -- 0 pods, 0 helm releases; docker has the machine"
    }
    for ($r = 1; $r -le $Runs; $r++) { $run++; Invoke-Run $run $cfg }
}
Log "############ MATRIX COMPLETE -> $CSV ############"
Log "Analyse with:  python perf-matrix-report.py `"$CSV`""
