/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/14/2026 mir0n  created: one-shot targeted residue purge -- walks the playground for any hauberk-office-smoke leftovers and deletes its subtree bottom-up
 */
package pro.mir0n.esquire.hauberk.simulations;

import io.gatling.javaapi.core.ScenarioBuilder;

import pro.mir0n.esquire.hauberk.chain.DeleteEntity;
import pro.mir0n.esquire.hauberk.config.EntityKinds;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * One-shot residue cleanup: walks from the playground parent, finds any
 * office named "hauberk-office-smoke", deletes its subtree bottom-up
 * (account, then user, then office). Safe to run repeatedly; if no
 * residue exists, the foreach loops simply iterate zero times.
 *
 * Account delete inside the Test House subtree is data-shape gated in
 * pacMan: ep_path startsWith "1.14." -> transactions purged and status
 * forced to "C" in memory so the production delete validator passes.
 */
@SimulationInfo("Targeted residue purge: any hauberk-office-smoke + its bottom-up subtree")
public class ResidueCleanupSimulation extends HauberkSimulation {

    ScenarioBuilder scn = scenario("residue-cleanup")
            .exec(http("GET /esq (root children, filter hauberk-office-smoke)")
                    .get("/esq")
                    .queryParam("id", HauberkConfig.PLAYGROUND_PARENT_ID)
                    .check(status().is(200))
                    .check(jsonPath("$[?(@.name=='hauberk-office-smoke')].id")
                            .findAll().saveAs("officeIds")))
            .foreach("#{officeIds}", "officeId").on(
                exec(http("GET /esq (office children)")
                        .get("/esq")
                        .queryParam("id", "#{officeId}")
                        .check(status().is(200))
                        .check(jsonPath("$[*].id").findAll().saveAs("userIds")))
                .foreach("#{userIds}", "userId").on(
                    exec(http("GET /esq (user children)")
                            .get("/esq")
                            .queryParam("id", "#{userId}")
                            .check(status().is(200))
                            .check(jsonPath("$[*].id").findAll().saveAs("acctIds")))
                    .foreach("#{acctIds}", "acctId").on(
                        exec(session -> session
                                .set("delKind", EntityKinds.ACCT_CLIENT)
                                .set("delId",   session.getString("acctId")))
                        .exec(DeleteEntity.chain)
                    )
                    .exec(session -> session
                            .set("delKind", EntityKinds.USR_CLIENT)
                            .set("delId",   session.getString("userId")))
                    .exec(DeleteEntity.chain)
                )
                .exec(session -> session
                        .set("delKind", EntityKinds.ORG)
                        .set("delId",   session.getString("officeId")))
                .exec(DeleteEntity.chain)
            );

    {
        setUp(scn.injectOpen(atOnceUsers(1)))
                .protocols(httpProtocol);
    }
}
