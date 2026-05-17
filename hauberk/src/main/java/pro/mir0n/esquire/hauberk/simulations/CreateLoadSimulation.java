/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: standalone create+delete user load -- the (c) scenario from LoadScenarios, super.create.workers VUs
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.time.Duration;

import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;

/**
 * Standalone create+delete load -- just the (c) scenario from
 * {@link LoadScenarios}. Uses super.create.workers + super.duration.seconds.
 */
@SimulationInfo("Create+delete user loop at deepest office (super.create.workers VUs)")
public class CreateLoadSimulation extends HauberkSimulation {

    {
        int w = HauberkConfig.SUPER_CREATE_WORKERS;
        if (w < 1) {
            throw new IllegalStateException(
                "CreateLoadSimulation: super.create.workers must be >= 1.");
        }
        setUp(LoadScenarios.CREATE.injectOpen(atOnceUsers(w)))
            .maxDuration(Duration.ofSeconds(HauberkConfig.SUPER_DURATION_SECONDS))
            .protocols(httpProtocol);
    }
}
