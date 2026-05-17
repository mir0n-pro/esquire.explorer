/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *
 *  History:
 * 05/14/2026 mir0n  created: KC well-known + gateway health probes run before sim start; aborts on failure
 * 05/17/2026 mir0n  auth-path probe branches on HauberkConfig.AUTH_MODE -- presents Basic for Vanilla Token Relay, Bearer otherwise;
 */
package pro.mir0n.esquire.hauberk.health;

import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Probes upstream services before a simulation starts. Fails fast (and loud)
 * if anything's down -- saves the operator from chasing thousands of KO
 * requests that all trace back to "service X was offline".
 *
 * Checked endpoints:
 *   - KC `/.well-known/openid-configuration` on the configured kc.base
 *   - Gateway `/actuator/health` on the configured gw.base
 *   - Gateway `/esq-kinds` with whichever edge credential the configured
 *     client uses (Bearer for Plain JWT / Phantom Token Relay, Basic for
 *     Vanilla Token Relay -- chosen by auth.mode) -- smoke-tests the full
 *     auth path: KC + gateway + Token Relay variant when one applies.
 *
 * Output is summarised; a single line per probe with OK / FAIL.
 */
public final class HealthPreCheck {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)   // ingress-nginx + HTTP/2 negotiation
            .connectTimeout(Duration.ofSeconds(5))  // mis-parses some KC responses as chunked
            .build();                               // when in fact they are Content-Length

    private HealthPreCheck() {}

    /**
     * Runs all probes and returns true if everything passed. On failure,
     * prints what's broken and returns false (caller decides to abort).
     */
    public static boolean run() {
        List<Probe> probes = new ArrayList<>();
        probes.add(new Probe("KC /.well-known",
                HauberkConfig.KC_BASE + "/realms/" + HauberkConfig.KC_REALM
                + "/.well-known/openid-configuration",
                null));
        probes.add(new Probe("GW /actuator/health",
                HauberkConfig.GW_BASE + "/actuator/health",
                null));

        boolean ret = true;
        System.out.println("[health] pre-check");
        for (Probe p : probes) {
            boolean ok = p.check();
            System.out.printf("  %-30s %s  (%s)%n", p.name, ok ? "OK" : "FAIL", p.url);
            if (!ok) {
                ret = false;
                if (p.lastError != null) {
                    System.out.println("      " + p.lastError);
                }
            }
        }
        // Auth path smoke: present the edge credential this client is
        // configured for and hit a protected endpoint. Bearer (Plain JWT
        // and Phantom Token Relay) fetches a KC token first; Basic
        // (Vanilla Token Relay) presents client_id:secret directly --
        // the gateway does the KC handshake on the hauberk's behalf.
        String label = HauberkConfig.isBasicAuth()
                ? "GW /esq-kinds w/ basic"
                : "GW /esq-kinds w/ bearer";
        try {
            String authHeader;
            if (HauberkConfig.isBasicAuth()) {
                authHeader = HauberkConfig.basicAuthHeader();
            } else {
                authHeader = "Bearer "
                        + pro.mir0n.esquire.hauberk.auth.KcTokenClient.fetchAccessToken();
            }
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(HauberkConfig.GW_BASE + "/esq-kinds"))
                    .timeout(Duration.ofSeconds(5))
                    .header("Authorization", authHeader)
                    .GET().build();
            HttpResponse<Void> resp = HTTP.send(req, HttpResponse.BodyHandlers.discarding());
            boolean ok = resp.statusCode() == 200;
            System.out.printf("  %-30s %s  (auth path, HTTP %d)%n",
                    label, ok ? "OK" : "FAIL", resp.statusCode());
            if (!ok) ret = false;
        } catch (Throwable t) {
            System.out.printf("  %-30s FAIL  (%s)%n", label, t.getMessage());
            ret = false;
        }
        if (!ret) {
            System.err.println("[health] pre-check FAILED -- aborting before sim starts.");
        }
        return ret;
    }

    private static final class Probe {
        final String name;
        final String url;
        final String body;
        String lastError;

        Probe(String name, String url, String body) {
            this.name = name;
            this.url  = url;
            this.body = body;
        }

        boolean check() {
            boolean ret = false;
            try {
                HttpRequest.Builder b = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(5));
                if (body == null) b.GET();
                else              b.POST(HttpRequest.BodyPublishers.ofString(body));
                HttpResponse<Void> resp = HTTP.send(b.build(), HttpResponse.BodyHandlers.discarding());
                ret = resp.statusCode() < 500;
                if (!ret) {
                    lastError = "HTTP " + resp.statusCode();
                }
            } catch (Throwable t) {
                lastError = t.getClass().getSimpleName() + ": " + t.getMessage();
            }
            return ret;
        }
    }
}
