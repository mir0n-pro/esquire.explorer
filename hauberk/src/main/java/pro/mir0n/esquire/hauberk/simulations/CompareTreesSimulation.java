/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: standalone CompareTrees runner -- diff biztree cache against the natural-FK subtree from the playground root
 */
package pro.mir0n.esquire.hauberk.simulations;

import io.gatling.javaapi.core.ScenarioBuilder;

import pro.mir0n.esquire.hauberk.chain.CompareTrees;
import pro.mir0n.esquire.hauberk.config.EntityKinds;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;

/**
 * Standalone CompareTrees runner. Defaults to comparing the hauberk
 * playground subtree from {@link HauberkConfig#PLAYGROUND_PARENT_ID}.
 * Useful as an ad-hoc tree-consistency check after unrelated operations,
 * or as a sanity gate before / after a sprint run.
 *
 * Output: mismatch lines on stderr with "[CompareTrees]" prefix. Counters
 * also land in the Gatling report indirectly via the 2 HTTP requests, but
 * the actual diff verdict is in stderr.
 */
@SimulationInfo("Standalone CompareTrees: diff biztree cache vs natural-FK subtree")
public class CompareTreesSimulation extends HauberkSimulation {

    ScenarioBuilder scn = scenario("compare-trees")
            .exec(session -> session
                    .set("compareSeedId",   HauberkConfig.PLAYGROUND_PARENT_ID)
                    .set("compareSeedKind", EntityKinds.ORG))
            .exec(CompareTrees.chain);

    {
        setUp(scn.injectOpen(atOnceUsers(1)))
                .protocols(httpProtocol);
    }
}
