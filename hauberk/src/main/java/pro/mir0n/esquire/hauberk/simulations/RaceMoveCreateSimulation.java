/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Phase 8b race repro -- move-oscillate + concurrent USR creates in moving subtree; self-validating diff DB ep_path vs biztree-derived path, prints PASS/FAIL
 */
package pro.mir0n.esquire.hauberk.simulations;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.gatling.javaapi.core.PopulationBuilder;
import io.gatling.javaapi.core.ScenarioBuilder;

import pro.mir0n.esquire.hauberk.chain.*;
import pro.mir0n.esquire.hauberk.config.EntityKinds;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * Phase 8b race repro: move + concurrent create race.
 *
 * Scenario: while an ORG oscillates between L1 and its original parent,
 * USRs are being created in the deepest office (a descendant of the
 * moving subtree). The new USR's ep_path is computed server-side from
 * the parent org's current ep_path; if the move's cascade is mid-flight,
 * the parent's path may be stale and the new USR persists with the wrong
 * path. The same wrong path propagates to biztree's tree_entity_path
 * via JMS and to KC's esq_rootpath attribute via kcMaster's URQ.
 *
 * Repro shape:
 *   1. Preconditions: PrepareForAnything has been run with depth >= 4
 *      so w1-l2, w1-l3, and w1-l4 exist.
 *   2. Load runs for super.duration.seconds:
 *      - LoadScenarios.MOVE  (super.move.workers VUs)
 *          oscillates w1-l3 between L1 and w1-l2.
 *      - LoadScenarios.CREATE-style scenario (without delete)
 *          super.create.workers VUs each loop CreateUser forever at
 *          the deepest office of the moving subtree.
 *   3. Settle pause (5s).
 *   4. Verification: for each kind=34 USR in the hauberk subtree,
 *      compare the entityPath returned by /esq-cmd-tree (authoritative,
 *      from esq_entity_path.ep_path) against the entityPath returned by
 *      /esq-tree (biztree-derived from tree_path with virtual-folder
 *      segments stripped). Any mismatch = race fired.
 *
 * Same code, two outcomes:
 *   pre-fix:  some USR entityPaths diverge -> FAIL (race reproduced)
 *   post-fix: every USR entityPath agrees -> PASS (regression test)
 *
 * Run:
 *   hauberk.cmd CleanHouse
 *   hauberk.cmd PrepareForAnything --prep-depth 4 --prep-clients 5 --prep-accounts 0
 *   hauberk.cmd RaceMoveCreate --duration 30 --move 2 --create 8
 *   hauberk.cmd CleanHouse
 */
@SimulationInfo("Race 8b: move + concurrent create; DB ep_path vs biztree path divergence")
public class RaceMoveCreateSimulation extends HauberkSimulation {

    // Move scenario reused as-is from LoadScenarios.
    private final ScenarioBuilder moveScn = LoadScenarios.MOVE;

    // Create-only (no delete) so survivors accumulate for path comparison.
    ScenarioBuilder createOnlyScn = scenario("race-move-create-only")
            .exec(session -> session.set("officeName", "hauberk-office-smoke"))
            .exec(LookupOfficeIdByName.chain)
            .exec(http("GET /esq-cmd-tree (find bottom office)")
                .get("/esq-cmd-tree")
                .queryParam("kind", EntityKinds.ORG)
                .queryParam("id",   "#{officeId}")
                .check(status().is(200))
                .check(jsonPath("$").ofList().saveAs("subtree")))
            .exec(session -> {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> tree =
                        (List<Map<String, Object>>) session.get("subtree");
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
                    System.err.println("[RaceMoveCreate] no office in subtree -- "
                            + "run PrepareForAnything first.");
                    return session.markAsFailed();
                }
                return session.set("officeId", deepestId);
            })
            .forever().on(exec(CreateUser.chain));

    // Verification scenario: compare entityPath per kind=34 USR.
    ScenarioBuilder verifyScn = scenario("race-move-verify")
            .exec(session -> session.set("officeName", "hauberk-office-smoke"))
            .exec(LookupOfficeIdByName.chain)
            .exec(http("GET /esq-cmd-tree (natural, post-load)")
                .get("/esq-cmd-tree")
                .queryParam("kind", EntityKinds.ORG)
                .queryParam("id",   "#{officeId}")
                .check(status().is(200))
                .check(jsonPath("$").ofList().saveAs("naturalNodes")))
            .exec(http("GET /esq-tree (biztree, post-load)")
                .get("/esq-tree")
                .queryParam("id", "#{officeId}")
                .check(status().is(200))
                .check(jsonPath("$").ofList().saveAs("biztreeNodes")))
            .exec(session -> {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> nat =
                        (List<Map<String, Object>>) session.get("naturalNodes");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> biz =
                        (List<Map<String, Object>>) session.get("biztreeNodes");

                // Build entityId -> entityPath maps for kind=34 only on each side.
                // For biztree side: skip shortcut nodes (linkId != null).
                Map<Long, String> natPath = new HashMap<>();
                for (Map<String, Object> n : nat) {
                    Object k = n.get("kind");
                    Object e = n.get("entityId");
                    if (k instanceof Number
                            && ((Number) k).intValue() == EntityKinds.USR_CLIENT
                            && e instanceof Number) {
                        natPath.put(((Number) e).longValue(),
                                String.valueOf(n.get("entityPath")));
                    }
                }
                Map<Long, String> bizPath = new HashMap<>();
                for (Map<String, Object> n : biz) {
                    Object k = n.get("kind");
                    Object e = n.get("entityId");
                    Object linkId = n.get("linkId");
                    if (k instanceof Number
                            && ((Number) k).intValue() == EntityKinds.USR_CLIENT
                            && e instanceof Number
                            && linkId == null) {
                        bizPath.put(((Number) e).longValue(),
                                String.valueOf(n.get("entityPath")));
                    }
                }

                List<Long> pathMismatches = new ArrayList<>();
                List<Long> bizMissing = new ArrayList<>();
                for (Map.Entry<Long, String> entry : natPath.entrySet()) {
                    Long id = entry.getKey();
                    String natP = entry.getValue();
                    String bizP = bizPath.get(id);
                    if (bizP == null) {
                        bizMissing.add(id);
                    } else if (!natP.equals(bizP)) {
                        pathMismatches.add(id);
                        // Print first few for diagnostic.
                        if (pathMismatches.size() <= 5) {
                            System.err.println("[RaceMoveCreate]  id=" + id
                                    + " natural=" + natP
                                    + " biztree=" + bizP);
                        }
                    }
                }

                System.err.println("[RaceMoveCreate] kind=34 USRs: natural="
                        + natPath.size() + " biztree=" + bizPath.size()
                        + " path-mismatches=" + pathMismatches.size()
                        + " missing-in-biztree=" + bizMissing.size());
                if (!pathMismatches.isEmpty()) {
                    System.err.println("[RaceMoveCreate] FAIL: RACE REPRODUCED -- "
                            + pathMismatches.size()
                            + " kind=34 USRs have entityPath divergence between "
                            + "DB (esq_entity_path.ep_path) and biztree "
                            + "(derived from tree_path).");
                    return session.markAsFailed();
                }
                if (!bizMissing.isEmpty()) {
                    System.err.println("[RaceMoveCreate] WARN: "
                            + bizMissing.size() + " USRs missing in biztree "
                            + "(unrelated cache-load race surface; see "
                            + "RaceCacheLoadSimulation).");
                }
                System.err.println("[RaceMoveCreate] PASS: every kind=34 USR's "
                        + "entityPath agrees between DB and biztree.");
                return session;
            });

    {
        int mW = HauberkConfig.SUPER_MOVE_WORKERS;
        int cW = HauberkConfig.SUPER_CREATE_WORKERS;
        int dur = HauberkConfig.SUPER_DURATION_SECONDS;
        if (mW < 1 || cW < 1) {
            throw new IllegalStateException(
                "RaceMoveCreateSimulation: both super.move.workers and "
                + "super.create.workers must be >= 1.");
        }

        System.err.println();
        System.err.println("================================================");
        System.err.println(" RACE 8b -- MOVE + CREATE PATH RACE REPRO");
        System.err.println(" Move oscillates w1-l3; concurrent creates at deepest office.");
        System.err.println("================================================");
        System.err.println();

        List<PopulationBuilder> pops = new ArrayList<>();
        pops.add(moveScn        .injectOpen(atOnceUsers(mW)));
        pops.add(createOnlyScn  .injectOpen(atOnceUsers(cW)));
        pops.add(verifyScn      .injectOpen(
                nothingFor(Duration.ofSeconds(dur + 5)),
                atOnceUsers(1)));

        setUp(pops)
            .maxDuration(Duration.ofSeconds(dur + 30))
            .protocols(httpProtocol);
    }
}
