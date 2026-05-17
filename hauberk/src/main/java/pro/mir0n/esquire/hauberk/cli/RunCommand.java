/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: picocli "run" subcommand; programmatic Gatling launch with --metrics, --output, --config, --times, shape knobs
 */
package pro.mir0n.esquire.hauberk.cli;

import io.gatling.javaapi.core.Simulation;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;
import pro.mir0n.esquire.hauberk.health.HealthPreCheck;

import java.util.concurrent.Callable;

/**
 * `hauberk run &lt;sim&gt; [options]` -- launches a Gatling Simulation
 * programmatically via {@link io.gatling.app.Gatling#fromArgs}.
 *
 * All knobs that used to live in hauberk.cmd are now picocli options here.
 * Property values are pushed into JVM system properties before Gatling
 * starts so {@code HauberkConfig}'s static initialiser picks them up at
 * the same JVM startup.
 */
@Command(name = "run",
        description = "Run a Gatling Simulation (programmatic launch).")
public class RunCommand implements Callable<Integer> {

    @Parameters(arity = "1",
            paramLabel = "SIM",
            description = "Simulation to run (FQCN, simple name, or short alias e.g. entity-smoke).")
    String sim;

    // --- metrics (Performance Matrix capture) ---

    @Option(names = "--metrics",
            description = "Enable Performance Matrix capture (per-request CSV + per-scenario summary).")
    boolean metrics;

    @Option(names = "--output",
            paramLabel = "FOLDER",
            description = "Output base folder. Each run goes into "
                    + "<output>/<sim>-<timestamp>/, holding the Gatling "
                    + "report (index.html, simulation.log, req_*.html) and "
                    + "the perf-matrix CSV(s) when --metrics is on. "
                    + "Default: ./output")
    String outputBase;

    // --- config overlay ---

    @Option(names = "--config",
            paramLabel = "FILE",
            description = "Path to a properties overlay (loaded on top of hauberk.properties).")
    String configFile;

    // --- SuperLoad shape knobs (system properties consumed by HauberkConfig) ---

    @Option(names = "--duration", paramLabel = "N",
            description = "super.duration.seconds")
    Integer duration;

    @Option(names = "--read",   paramLabel = "N", description = "super.read.workers")   Integer read;
    @Option(names = "--update", paramLabel = "N", description = "super.update.workers") Integer update;
    @Option(names = "--create", paramLabel = "N", description = "super.create.workers") Integer create;
    @Option(names = "--move",   paramLabel = "N", description = "super.move.workers")   Integer move;
    @Option(names = "--tx",     paramLabel = "N", description = "super.tx.workers")     Integer tx;

    // --- Prepare shape knobs ---

    @Option(names = "--prep-depth",    paramLabel = "N", description = "prepare.offices.depth")        Integer prepDepth;
    @Option(names = "--prep-clients",  paramLabel = "N", description = "prepare.clients.per.office")   Integer prepClients;
    @Option(names = "--prep-accounts", paramLabel = "N", description = "prepare.accounts.per.client")  Integer prepAccounts;

    // --- Move sim shape knobs ---

    @Option(names = "--move-depth",    paramLabel = "N", description = "move.offices.depth")        Integer moveDepth;
    @Option(names = "--move-clients",  paramLabel = "N", description = "move.clients.per.office")   Integer moveClients;
    @Option(names = "--move-accounts", paramLabel = "N", description = "move.accounts.per.client")  Integer moveAccounts;

    // --- repeat ---

    @Option(names = {"--times", "-n"},
            paramLabel = "N",
            description = "Run the sim N times in sequence (each gets its own Gatling report). Default 1.")
    int times = 1;

    @Option(names = "--no-health-check",
            description = "Skip the pre-flight HealthPreCheck (KC + gateway + auth path).")
    boolean noHealthCheck;

    @Override
    public Integer call() {
        applyProperties();
        if (!noHealthCheck) {
            if (!HealthPreCheck.run()) {
                return 3;
            }
        }
        Class<? extends Simulation> simClass = SimulationCatalog.resolve(sim);
        String base = (outputBase != null && !outputBase.isBlank()) ? outputBase : "./output";
        System.setProperty("hauberk.output.base", base);
        int ret = 0;
        for (int i = 1; i <= times; i++) {
            if (times > 1) {
                System.out.printf("--- pass %d / %d ---%n", i, times);
            }
            java.io.File baseDir = new java.io.File(base);
            java.util.Set<String> before = listSubdirs(baseDir);
            // Gatling's Scala companion exposes a Java-callable fromArgs(int)
            // that returns an exit code without System.exit; the Java-class
            // form (Gatling.main) calls System.exit and breaks --times.
            int code = io.gatling.app.Gatling$.MODULE$.fromArgs(
                    new String[] {
                        "-s",  simClass.getName(),
                        "-rd", simClass.getSimpleName(),
                        "-rf", base
                    });
            if (code != 0) {
                ret = code;
            }
            // Gatling created exactly one new subdir for this run; move our
            // perf-matrix CSVs into it so the run's artefacts ship together.
            java.io.File runDir = newestSubdirSince(baseDir, before);
            if (runDir != null) {
                pro.mir0n.esquire.hauberk.perf.PerformanceMatrix.moveFilesInto(runDir);
            }
        }
        return ret;
    }

    /** Snapshot of subdir names under {@code dir}. Empty set if dir absent. */
    private static java.util.Set<String> listSubdirs(java.io.File dir) {
        java.util.Set<String> ret = new java.util.HashSet<>();
        java.io.File[] kids = dir.listFiles(java.io.File::isDirectory);
        if (kids != null) {
            for (java.io.File k : kids) {
                ret.add(k.getName());
            }
        }
        return ret;
    }

    /** Return the most recently modified subdir of {@code dir} not in {@code before}. */
    private static java.io.File newestSubdirSince(java.io.File dir, java.util.Set<String> before) {
        java.io.File ret = null;
        java.io.File[] kids = dir.listFiles(java.io.File::isDirectory);
        if (kids != null) {
            long newest = Long.MIN_VALUE;
            for (java.io.File k : kids) {
                if (!before.contains(k.getName()) && k.lastModified() > newest) {
                    newest = k.lastModified();
                    ret = k;
                }
            }
        }
        return ret;
    }

    private void applyProperties() {
        // --metrics is the on/off toggle. --output only controls WHERE
        // things go; supplying --output without --metrics gives you the
        // Gatling report in the new folder but no perf-matrix CSV.
        if (metrics) {
            System.setProperty("hauberk.metrics", "true");
        }
        if (configFile != null && !configFile.isBlank()) {
            System.setProperty("hauberk.config", configFile);
        }
        // shape knobs -- only set if user supplied; HauberkConfig still reads
        // the file for defaults.
        setIfPresent("super.duration.seconds",         duration);
        setIfPresent("super.read.workers",             read);
        setIfPresent("super.update.workers",           update);
        setIfPresent("super.create.workers",           create);
        setIfPresent("super.move.workers",             move);
        setIfPresent("super.tx.workers",               tx);
        setIfPresent("prepare.offices.depth",          prepDepth);
        setIfPresent("prepare.clients.per.office",     prepClients);
        setIfPresent("prepare.accounts.per.client",    prepAccounts);
        setIfPresent("move.offices.depth",             moveDepth);
        setIfPresent("move.clients.per.office",        moveClients);
        setIfPresent("move.accounts.per.client",       moveAccounts);
    }

    private static void setIfPresent(String key, Integer val) {
        if (val != null) {
            System.setProperty(key, String.valueOf(val));
        }
    }
}
