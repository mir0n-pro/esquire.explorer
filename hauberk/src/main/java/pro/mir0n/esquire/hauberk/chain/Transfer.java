/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: Chain POST /esq-acct typeId=3 transfer between two accounts (id + id2/kind2)
 */
package pro.mir0n.esquire.hauberk.chain;

import io.gatling.javaapi.core.ChainBuilder;
import pro.mir0n.esquire.hauberk.config.EntityKinds;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

/**
 * POST /esq-acct, transaction kind=1004 (Transfer). Debits the source account
 * (id) and credits the target account (id2). Single endpoint call -- pacMan
 * inserts the matched debit/credit pair atomically.
 *
 * Session inputs:
 *   acctId     -- source account id (debited)
 *   acctId2    -- target account id (credited)
 *   txAmount   -- numeric amount
 */
public final class Transfer {

    private Transfer() {}

    public static final ChainBuilder chain =
        exec(http("POST /esq-acct (transfer)")
            .post("/esq-acct")
            .queryParam("kind", EntityKinds.ACCT_CLIENT)
            .queryParam("id",   "#{acctId}")
            .queryParam("cmd",  "acct")
            .header("Content-Type", "application/json")
            .body(StringBody(
                "{\"typeId\":3,"
              + "\"amount\":#{txAmount},"
              + "\"id2\":\"#{acctId2}\","
              + "\"kind2\":" + EntityKinds.ACCT_CLIENT + ","
              + "\"refCode\":\"cc\","
              + "\"refCode2\":\"TSHIRT-XFR\","
              + "\"desc\":\"hauberk transfer\"}"))
            .check(status().is(200)));
}
