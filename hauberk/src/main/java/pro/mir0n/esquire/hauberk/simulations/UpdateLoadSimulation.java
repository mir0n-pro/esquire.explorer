/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: standalone update load -- the (b) scenario from LoadScenarios, super.update.workers VUs
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.time.Duration;

import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;

/**
 * Standalone update load -- just the (b) scenario from {@link LoadScenarios}.
 * Uses super.update.workers + super.duration.seconds.
 */
@SimulationInfo("Update load: random POST /esq-cmd-save postal-address edits")
public class UpdateLoadSimulation extends HauberkSimulation {

    {
        int w = HauberkConfig.SUPER_UPDATE_WORKERS;
        if (w < 1) {
            throw new IllegalStateException(
                "UpdateLoadSimulation: super.update.workers must be >= 1.");
        }
        setUp(LoadScenarios.UPDATE.injectOpen(atOnceUsers(w)))
            .maxDuration(Duration.ofSeconds(HauberkConfig.SUPER_DURATION_SECONDS))
            .protocols(httpProtocol);
    }
}
