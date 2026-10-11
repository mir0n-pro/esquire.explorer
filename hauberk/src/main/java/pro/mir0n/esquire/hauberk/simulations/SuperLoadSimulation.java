/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: all 5 LoadScenarios in parallel for super.duration.seconds against a shared playground; one Simulation, five concurrent populations
 * 09/24/2026 mir0n  v1.2.16 -- TREE, READ_ACCT, TREE_SMALL, CACHE and CACHE_SMALL join the parallel
 *                   populations, each injected only when its worker count is above zero; the
 *                   nothing-to-run guard sums all ten. The javadoc and @SimulationInfo no longer say five
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import io.gatling.javaapi.core.PopulationBuilder;

import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;

/**
 * Phase 6 load smoke -- runs the load scenarios in parallel.
 * Sub-scenarios are defined once in {@link LoadScenarios} and reused
 * here + by the standalone {Read,Update,Create,Move,Tx}LoadSimulation
 * variants.
 *
 * Knobs (hauberk.properties):
 *   super.duration.seconds          -- global stop time for all scenarios
 *   super.{name}.workers            -- per-scenario VU count (0 disables)
 */
@SimulationInfo("All load scenarios in parallel (read/update/create/move/tx/tree/readacct) for duration")
public class SuperLoadSimulation extends HauberkSimulation {

    {
        int rW = HauberkConfig.SUPER_READ_WORKERS;
        int uW = HauberkConfig.SUPER_UPDATE_WORKERS;
        int cW = HauberkConfig.SUPER_CREATE_WORKERS;
        int mW = HauberkConfig.SUPER_MOVE_WORKERS;
        int tW = HauberkConfig.SUPER_TX_WORKERS;
        int eW = HauberkConfig.SUPER_TREE_WORKERS;
        int aW = HauberkConfig.SUPER_READACCT_WORKERS;
        int sW = HauberkConfig.SUPER_TREESMALL_WORKERS;
        int hW = HauberkConfig.SUPER_CACHE_WORKERS;
        int zW = HauberkConfig.SUPER_CACHESMALL_WORKERS;
        if (rW + uW + cW + mW + tW + eW + aW + sW + hW + zW < 1) {
            throw new IllegalStateException(
                "SuperLoadSimulation: at least one super.*.workers must be > 0 "
                + "(all are currently 0). Edit hauberk.properties.");
        }

        List<PopulationBuilder> pops = new ArrayList<>();
        if (rW > 0) pops.add(LoadScenarios.READ  .injectOpen(atOnceUsers(rW)));
        if (uW > 0) pops.add(LoadScenarios.UPDATE.injectOpen(atOnceUsers(uW)));
        if (cW > 0) pops.add(LoadScenarios.CREATE.injectOpen(atOnceUsers(cW)));
        if (mW > 0) pops.add(LoadScenarios.MOVE  .injectOpen(atOnceUsers(mW)));
        if (tW > 0) pops.add(LoadScenarios.TX    .injectOpen(atOnceUsers(tW)));
        if (eW > 0) pops.add(LoadScenarios.TREE  .injectOpen(atOnceUsers(eW)));
        if (aW > 0) pops.add(LoadScenarios.READ_ACCT.injectOpen(atOnceUsers(aW)));
        if (sW > 0) pops.add(LoadScenarios.TREE_SMALL.injectOpen(atOnceUsers(sW)));
        if (hW > 0) pops.add(LoadScenarios.CACHE.injectOpen(atOnceUsers(hW)));
        if (zW > 0) pops.add(LoadScenarios.CACHE_SMALL.injectOpen(atOnceUsers(zW)));

        setUp(pops)
            .maxDuration(Duration.ofSeconds(HauberkConfig.SUPER_DURATION_SECONDS))
            .protocols(httpProtocol);
    }
}
