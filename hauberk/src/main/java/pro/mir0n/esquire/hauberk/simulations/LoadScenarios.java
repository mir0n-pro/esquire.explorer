/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: shared scenario library (READ/UPDATE/CREATE/MOVE/TX) used by SuperLoad and the five standalone *LoadSimulation variants
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.util.List;
import java.util.Map;

import io.gatling.javaapi.core.ScenarioBuilder;

import pro.mir0n.esquire.hauberk.chain.*;
import pro.mir0n.esquire.hauberk.config.EntityKinds;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Reusable ScenarioBuilders for the 5 load shapes. Each is a public
 * static .forever() loop intended to be driven by an outer setUp(...)
 * call with maxDuration. Used by:
 *   - SuperLoadSimulation (all 5 in parallel)
 *   - {Read,Update,Create,Move,Tx}LoadSimulation (one at a time)
 *
 * Constants:
 *   TX_AMOUNT -- fixed deposit/withdraw amount for the tx scenario; the
 *                deposit-then-withdrawal pair is net-zero so balance
 *                stays predictable under concurrent load.
 */
public final class LoadScenarios {

    private LoadScenarios() {}

    public static final String TX_AMOUNT = "10.00";

    // (a) read random user details
    public static final ScenarioBuilder READ = scenario("load-read")
            .exec(PoolFetchUsers.chain)
            .forever().on(
                exec(PickRandomFromPool.userChain)
                .exec(ReadUserDetail.chain)
            );

    // (b) update random user's address
    public static final ScenarioBuilder UPDATE = scenario("load-update")
            .exec(PoolFetchUsers.chain)
            .forever().on(
                exec(PickRandomFromPool.userChain)
                .exec(UpdateUserAddress.chain)
            );

    // (c) create + delete user at deepest office in the hauberk subtree
    public static final ScenarioBuilder CREATE = scenario("load-create")
            .exec(session -> session.set("officeName", "hauberk-office-smoke"))
            .exec(LookupOfficeIdByName.chain)
            .exec(http("GET /esq-cmd-tree (find bottom office in hauberk subtree)")
                .get("/esq-cmd-tree")
                .queryParam("kind", EntityKinds.ORG)
                .queryParam("id",   "#{officeId}")
                .check(status().is(200))
                .check(jsonPath("$").ofList().saveAs("createSubtree")))
            .exec(session -> {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> tree =
                        (List<Map<String, Object>>) session.get("createSubtree");
                String deepestId = null;
                int maxLevel = -1;
                for (Map<String, Object> n : tree) {
                    Object kind  = n.get("kind");
                    Object level = n.get("level");
                    if (kind instanceof Number
                            && ((Number) kind).intValue() == EntityKinds.ORG
                            && level instanceof Number) {
                        int lvl = ((Number) level).intValue();
                        if (lvl > maxLevel) {
                            maxLevel = lvl;
                            deepestId = String.valueOf(n.get("id"));
                        }
                    }
                }
                if (deepestId == null) {
                    System.err.println("[LoadScenarios] CREATE: no office found "
                            + "-- did PrepareForAnything run?");
                    return session.markAsFailed();
                }
                return session.set("officeId", deepestId);
            })
            .forever().on(
                exec(CreateUser.chain)
                .exec(session -> session
                        .set("delKind", EntityKinds.USR_CLIENT)
                        .set("delId",   session.getString("userId")))
                .exec(DeleteEntity.chain)
            );

    // (d) move oscillate -- all VUs hit the SAME shared office w1-l3
    public static final ScenarioBuilder MOVE = scenario("load-move")
            .exec(session -> session.set("officeName", "hauberk-office-smoke"))
            .exec(LookupOfficeIdByName.chain)
            .exec(session -> session.set("moveTopId",
                    session.getString("officeId")))
            .exec(session -> session.set("officeName", "w1-l2"))
            .exec(LookupOfficeIdByName.chain)
            .exec(session -> session.set("moveOriginalParentId",
                    session.getString("officeId")))
            .exec(session -> session.set("officeName", "w1-l3"))
            .exec(LookupOfficeIdByName.chain)
            .exec(session -> session.set("moveTargetId",
                    session.getString("officeId")))
            .forever().on(
                exec(session -> session
                        .set("moveKind",   EntityKinds.ORG)
                        .set("moveId",     session.getString("moveTargetId"))
                        .set("moveDestId", session.getString("moveTopId")))
                .exec(MoveEntity.chain)
                .exec(session -> session
                        .set("moveDestId", session.getString("moveOriginalParentId")))
                .exec(MoveEntity.chain)
            );

    // (e) tx cycle -- deposit then withdrawal on random account; net-zero
    public static final ScenarioBuilder TX = scenario("load-tx")
            .exec(PoolFetchAccounts.chain)
            .forever().on(
                exec(PickRandomFromPool.acctChain)
                .exec(session -> session
                        .set("acctId",   session.getString("pickedAcctId"))
                        .set("txAmount", TX_AMOUNT))
                .exec(Deposit.chain)
                .exec(Withdrawal.chain)
            );
}
