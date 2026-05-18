/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Chain GET /esq-cmd-tree, filter kind=34 USRs, save list as userPool for random picks
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.EntityKinds;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Two-step pool fetch scoped to the hauberk subtree:
 *   1. GET /esq-enode?kind=20&name=hauberk-office-smoke  -> L1 id
 *   2. GET /esq-cmd-tree?kind=20&id={L1}                  -> subtree
 *   3. jsonPath filter for kind==34 entities             -> userPool
 *
 * Scoping to L1 keeps the pool free of pre-seed users (e.g. "Cli Ent"
 * id=10), so SuperLoad's update scenario won't mutate canned data.
 *
 * Session outputs:
 *   userPool -- List<String> of kind=34 user ids under hauberk-office-smoke.
 *
 * Session side effect:
 *   officeName / officeId -- temporarily set by the L1 lookup; downstream
 *   chains that depend on those should set them explicitly anyway.
 */
public final class PoolFetchUsers {

    private PoolFetchUsers() {}

    public static final ChainBuilder chain =
        exec(session -> session.set("officeName", "hauberk-office-smoke"))
        .exec(LookupOfficeIdByName.chain)
        .exec(http("GET /esq-cmd-tree (fetch user pool, hauberk subtree)")
            .get("/esq-cmd-tree")
            .queryParam("kind", EntityKinds.ORG)
            .queryParam("id",   "#{officeId}")
            .check(status().is(200))
            .check(jsonPath("$[?(@.kind==" + EntityKinds.USR_CLIENT + ")].id")
                    .findAll().saveAs("userPool")));
}
