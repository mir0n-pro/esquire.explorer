/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: standalone tx-cycle load -- the (e) scenario from LoadScenarios; random account deposit+withdrawal net-zero per iter
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.time.Duration;

import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;

/**
 * Standalone tx cycle load -- just the (e) scenario from
 * {@link LoadScenarios}. Each iteration: pick random account, deposit,
 * withdrawal (net-zero). Uses super.tx.workers + super.duration.seconds.
 */
@SimulationInfo("Tx cycle load: random account, Deposit + Withdrawal (net-zero per iter)")
public class TxLoadSimulation extends HauberkSimulation {

    {
        int w = HauberkConfig.SUPER_TX_WORKERS;
        if (w < 1) {
            throw new IllegalStateException(
                "TxLoadSimulation: super.tx.workers must be >= 1.");
        }
        setUp(LoadScenarios.TX.injectOpen(atOnceUsers(w)))
            .maxDuration(Duration.ofSeconds(HauberkConfig.SUPER_DURATION_SECONDS))
            .protocols(httpProtocol);
    }
}
