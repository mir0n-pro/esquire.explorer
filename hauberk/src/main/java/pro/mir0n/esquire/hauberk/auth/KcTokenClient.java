/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/14/2026 mir0n  created: plain-Java KC client_credentials grant against /token; returns raw access_token
 */
package pro.mir0n.esquire.hauberk.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import pro.mir0n.esquire.hauberk.config.HauberkConfig;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Fetches an OAuth2 access token from Keycloak via the client_credentials grant.
 *
 * The returned token is a JWS (or JWE during the Phase 3 JWE re-evaluation) signed
 * by the esquire realm and carrying the standard Esquire claims (esq_uid,
 * esq_rootpath, realm_access.roles) as configured on the esq-hauberk KC client.
 *
 * Used by Simulation `before()` hooks to obtain a Bearer for subsequent calls,
 * and by ad-hoc Java tooling that needs a token for inspection (e.g. token-shape
 * checks in Phase 3).
 *
 * No caching here -- callers fetch once per Simulation and stash in a Session
 * attribute / system property. Tokens TTL is 5 min by default; long Simulations
 * will need a refresh helper layered on top.
 */
public final class KcTokenClient {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)    // see HealthPreCheck note
            .connectTimeout(Duration.ofSeconds(10))  // -- ingress-nginx HTTP/2 negotiation
            .build();                                // -- mangles KC responses

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private KcTokenClient() {}

    /** Fetch a fresh access token. Throws on any failure. */
    public static String fetchAccessToken() {
        String ret;
        try {
            String form = "grant_type=client_credentials"
                    + "&client_id="     + HauberkConfig.KC_CLIENT_ID
                    + "&client_secret=" + HauberkConfig.KC_CLIENT_SECRET;
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(HauberkConfig.tokenEndpoint()))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();
            HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new IllegalStateException(
                        "KC " + HauberkConfig.tokenEndpoint() + " returned "
                                + resp.statusCode() + ": " + resp.body());
            }
            JsonNode body = MAPPER.readTree(resp.body());
            ret = body.path("access_token").asText(null);
            if (ret == null || ret.isBlank()) {
                throw new IllegalStateException(
                        "KC token response missing access_token: " + resp.body());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("KC token fetch failed: " + e.getMessage(), e);
        }
        return ret;
    }
}
