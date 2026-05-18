/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Chain POST /esq-cmd-new kind=50 client account under session userId; desc = userEmail; saves acctId
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.EntityKinds;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * POST /esq-cmd-new for kind=50 (Client account) under the user captured by
 * CreateUser. Critical: the account "desc" field is set to the parent user's
 * email (e.g. "hauberk-user-7@mir0n.pro"). pacMan's account-delete handler
 * checks desc.endsWith("@mir0n.pro") to enable the test-data purge hook.
 *
 * Session inputs:
 *   userId     -- parent user id (from CreateUser)
 *   userEmail  -- parent user email (from CreateUser); written into desc
 * Session outputs:
 *   acctId     -- new account id
 */
public final class CreateAccount {

    private CreateAccount() {}

    public static final ChainBuilder chain =
        exec(http("POST /esq-cmd-new (account)")
            .post("/esq-cmd-new")
            .queryParam("kind",     EntityKinds.ACCT_CLIENT)
            .queryParam("parentId", "#{userId}")
            .queryParam("cmd",      "new")
            .header("Content-Type", "application/json")
            .body(StringBody(
                "{\"name\":\"acct-#{userSlug}\","
              + "\"desc\":\"#{userEmail}\","
              + "\"ccy\":\"USD\","
              + "\"status\":\"O\","
              + "\"negativeAllowed\":\"N\"}"))
            .check(status().is(200))
            .check(jsonPath("$.id").saveAs("acctId")));
}
