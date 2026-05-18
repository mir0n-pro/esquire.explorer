/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: picocli @Command root entry point; dispatches to run / list / summary / diff / help subcommands
 */
package pro.mir0n.esquire.hauberk.cli;

import picocli.CommandLine;
import picocli.CommandLine.Command;

/**
 * Top-level entrypoint for the Esquire Haubergeon harness.
 *
 * Run:
 *   java -jar target/hauberk.jar &lt;subcommand&gt;
 *
 * Subcommands:
 *   run   -- launch a Gatling Simulation
 *   list  -- list discovered Simulation classes
 *   diff  -- side-by-side compare of two perf-matrix CSV files
 *
 * Default with no args: print help.
 */
@Command(name = "hauberk",
        mixinStandardHelpOptions = true,
        version = "hauberk 1.2.4",
        description = "Esquire Haubergeon -- Gatling stress / load test harness.",
        subcommands = {
                RunCommand.class,
                ListCommand.class,
                SummaryCommand.class,
                DiffCommand.class,
                CommandLine.HelpCommand.class
        })
public final class HauberkCli implements Runnable {

    @Override
    public void run() {
        // No subcommand given -> show help (picocli mixin).
        CommandLine.usage(this, System.out);
    }

    public static void main(String[] args) {
        int exitCode = new CommandLine(new HauberkCli()).execute(args);
        System.exit(exitCode);
    }
}
