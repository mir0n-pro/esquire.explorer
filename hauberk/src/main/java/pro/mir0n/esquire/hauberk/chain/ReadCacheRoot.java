/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 09/24/2026 mir0n  created: Chain GET /esq-tree on the driver's own root, served from the bizTree cache; used by Cache load
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * GET /esq-tree?id={playground parent}. The same subtree ReadTreeRoot asks
 * enyMan to walk, answered instead from the bizTree cache -- the path the
 * gateway and the cache share, and the one that becomes in-process when
 * they are merged.
 *
 * No session inputs: the id is fixed for the run.
 */
public final class ReadCacheRoot {

    private ReadCacheRoot() {}

    public static final ChainBuilder chain =
        exec(http("GET /esq-tree (cache, from root)")
            .get("/esq-tree")
            .queryParam("id", HauberkConfig.PLAYGROUND_PARENT_ID)
            .check(status().is(200)));
}
