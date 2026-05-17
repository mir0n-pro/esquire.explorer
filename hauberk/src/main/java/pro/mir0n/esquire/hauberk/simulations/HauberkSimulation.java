/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: abstract base for every hauberk Simulation -- pulls up lazy RefreshableToken, instrumented httpProtocol with PerformanceMatrix, and after() perf-matrix flush
 * 05/17/2026 mir0n  Authorization header branches on HauberkConfig.AUTH_MODE -- Basic for Vanilla Token Relay, Bearer (KC JWT) otherwise
 */
package pro.mir0n.esquire.hauberk.simulations;

import io.gatling.javaapi.core.Session;
import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;

import pro.mir0n.esquire.hauberk.auth.RefreshableToken;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;
import pro.mir0n.esquire.hauberk.perf.PerformanceMatrix;

import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Abstract base for every hauberk {@code Simulation}. Centralises the
 * boilerplate that used to be duplicated in 16 subclasses:
 *
 * <ul>
 *   <li>The {@code RefreshableToken} (lazy, so the first KC handshake
 *       fires on first request not at construction).</li>
 *   <li>The {@code httpProtocol} builder with KC bearer header +
 *       {@code PerformanceMatrix.instrument(...)} so {@code --metrics}
 *       works uniformly.</li>
 *   <li>The {@code after()} hook that flushes the per-scenario perf
 *       matrix on sim end.</li>
 * </ul>
 *
 * The catalog description is carried as a class-level annotation:
 * {@link SimulationInfo @SimulationInfo("...")}. {@code ListCommand}
 * reads it reflectively from the {@code Class} object -- not from an
 * instance -- because Gatling's {@code Simulation} constructor refuses
 * direct {@code new} calls outside the Gatling runner. Presence on every
 * concrete sim is enforced by a unit test rather than by the compiler.
 *
 * Each subclass shrinks to: the {@code @SimulationInfo} annotation, a
 * scenario, and the instance-initialiser {@code setUp(...).protocols(httpProtocol)}
 * block.
 */
public abstract class HauberkSimulation extends Simulation {

    /** Lazy KC token; first KC handshake fires on first request, not on construction. */
    protected final RefreshableToken TOKEN = RefreshableToken.lazy();

    /**
     * Gatling HTTP protocol pre-wired with: gateway base URL, JSON Accept,
     * KC bearer header (re-evaluated per request so token auto-refresh
     * works mid-run), and Performance Matrix capture. Subclasses just pass
     * this to {@code setUp(...).protocols(httpProtocol)}.
     */
    protected final HttpProtocolBuilder httpProtocol = PerformanceMatrix.instrument(
            getClass(),
            http.baseUrl(HauberkConfig.GW_BASE)
                .acceptHeader("application/json")
                .header("Authorization", (Session __sess) ->
                    HauberkConfig.isBasicAuth()
                        ? HauberkConfig.basicAuthHeader()
                        : "Bearer " + TOKEN.value()));

    @Override
    public void after() {
        PerformanceMatrix.printSummary(getClass().getSimpleName());
    }
}
