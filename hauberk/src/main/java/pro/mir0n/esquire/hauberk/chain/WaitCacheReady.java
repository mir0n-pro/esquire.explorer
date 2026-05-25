/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/23/2026 mir0n  created: poll GET /esq-tree on the playground root until bizTree answers 200 --
 *                   used after a Cmd recreate/restart of bizTree to wait until its cache is loaded
 *                   and serving before the scenario proceeds.
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Blocks the scenario until bizTree is up and serving its cache: retries a GET on the playground-root
 * subtree until it returns 200 (while bizTree is down/booting/loading the gateway answers 5xx).
 * Use after {@code Cmd.run("recreate-biztree"/"restart-biztree")}.
 */
public final class WaitCacheReady {

    private WaitCacheReady() {}

    private static final int MAX_TRIES = 45;   // x2s = up to ~90s for boot + cache load

    public static final ChainBuilder chain =
        tryMax(MAX_TRIES).on(
            pause(Duration.ofSeconds(2))
            .exec(http("wait biztree cache ready")
                .get("/esq-tree")
                .queryParam("id", HauberkConfig.PLAYGROUND_PARENT_ID)
                .check(status().is(200)))
        );
}
