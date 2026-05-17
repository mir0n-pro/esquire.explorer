/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Chain GET /esq?id=officeId for children-of-office list
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * GET /esq?id=${officeId} -- list direct children of the office on the tree
 * (bizTree). Returns EsqTreeNode[]; the hauberk only asserts 200 here, the
 * load measurement is in the timing of the GET itself.
 *
 * Session inputs:
 *   officeId  -- the office whose children to list
 */
public final class ReadUsers {

    private ReadUsers() {}

    public static final ChainBuilder chain =
        exec(http("GET /esq (children of office)")
            .get("/esq")
            .queryParam("id", "#{officeId}")
            .check(status().is(200)));
}
