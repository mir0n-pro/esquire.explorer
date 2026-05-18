/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Chain GET /esq-enode?kind=34&id=userId for fuller user info (biztree shortcut)
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.EntityKinds;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * GET /esq-enode?kind=34&id=${userId} -- single-entity tree-node lookup
 * (bizTree). Used by the hauberk as a representative "load user details"
 * read. Asserts 200.
 *
 * Session inputs:
 *   userId  -- user entity id
 */
public final class ReadUserDetails {

    private ReadUserDetails() {}

    public static final ChainBuilder chain =
        exec(http("GET /esq-enode (user)")
            .get("/esq-enode")
            .queryParam("kind", EntityKinds.USR_CLIENT)
            .queryParam("id",   "#{userId}")
            .check(status().is(200)));
}
