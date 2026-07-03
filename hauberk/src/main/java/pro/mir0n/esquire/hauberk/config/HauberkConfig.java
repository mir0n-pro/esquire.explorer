/*
 *  Esquire frameworks (tm)
 *  Esquire Haubergeon (Gatling stress/load harness)
 *
 *  Copyright(c) 2001, 2026 mir0n&co www.mir0n.pro
 *  mailto:mir0n.the.programmer@gmail.com
 *
 *  History:
 * 05/14/2026 mir0n  created: typed config (endpoints, KC client+secret, playground id, prepare/move/super knobs, metrics) loaded from hauberk.properties + optional overlay
 * 05/17/2026 mir0n  added tokenRelay.type (plain | vanilla | phantom) + isBasicAuth() + basicAuthHeader() so the harness can present HTTP Basic at the edge for Vanilla Token Relay runs; overlay javadoc decoupled from JWS+ naming
 * 05/23/2026 mir0n  added the cmd.* infra-command map (COMMANDS) + static command(key) accessor
 *                   (cmd.<key> property, -Dcmd.<key> CLI override; throws if unset) so a Simulation can
 *                   drive the stack via Cmd.run("key").
 * 06/02/2026 mir0n  added KC_ADMIN_USER / KC_ADMIN_PASSWORD (kc.admin.user / kc.admin.password, default
 *                   admin/q) for the master-realm admin REST sims (race-8c verify, KC orphan cleanup)
 * 06/29/2026 mir0n  added ENYMAN_BASE (enyman.base, required) -- enyMan reached directly for the R6 timeout smoke
 * 07/02/2026 mir0n  added PG_URL / PG_USER / PG_PASSWORD (pg.url / pg.user / pg.password) for the kc-reconcile
 *                   utility's direct JDBC read of esq2025
 */
package pro.mir0n.esquire.hauberk.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Properties;

/**
 * Connectivity configuration for the hauberk module. All settings are read
 * from a single properties file at the hauberk module root: hauberk.properties.
 *
 * No env vars, no profiles, no fallbacks. Edit the file to point at a
 * different stack (compose / local k8s / OKE).
 */
public final class HauberkConfig {

    private HauberkConfig() {}

    /** Always-loaded base config (module-root canonical settings). */
    private static final String BASE_CONFIG_FILE = "hauberk.properties";

    /**
     * Optional overlay file, named via system property `hauberk.config`.
     * When set to anything other than the base, the file is loaded on top
     * of hauberk.properties -- its keys win, missing keys fall through to
     * the base. Lets a target overlay carry only the deltas (e.g.,
     * hauberk-k8s.properties flips kc.base / gw.base / bff.base for local
     * k8s, hauberk-oke.properties does the same for OKE -- everything
     * else, including kc.client.id + auth.mode, inherits from
     * hauberk.properties or is set explicitly inside the overlay).
     */
    private static final String CONFIG_FILE =
        System.getProperty("hauberk.config", BASE_CONFIG_FILE);

    public static final String KC_BASE;
    public static final String KC_REALM;
    public static final String KC_CLIENT_ID;
    public static final String KC_CLIENT_SECRET;
    public static final String GW_BASE;
    public static final String BFF_BASE;
    /** enyMan reached DIRECTLY (not via the gateway) -- the R6 HA timeout smoke hits the flag-gated /test hook. */
    public static final String ENYMAN_BASE;

    /** Master-realm bootstrap admin credentials. Used by KC admin REST simulations
     *  (race-8c verify, KC orphan cleanup) to issue token + manage users in the
     *  esquire realm. Optional -- only required by sims that touch the admin API. */
    public static final String KC_ADMIN_USER;
    public static final String KC_ADMIN_PASSWORD;

    /** Direct esq2025 connection for the OUT-OF-BAND kc-reconcile utility (PG/JDBC). Optional -- only the
     *  kc-reconcile command touches them, so they are NOT {@code require}d (sims never open a DB). */
    public static final String PG_URL;
    public static final String PG_USER;
    public static final String PG_PASSWORD;

    /**
     * Token Relay pattern this run targets at the gateway. Names the
     * end-to-end auth flow semantically, not the byte-level transport:
     *   plain    (default) -- Plain JWT: hauberk sends Bearer (KC JWT);
     *                         gateway validates the JWS locally; no
     *                         token relay involved.
     *   vanilla            -- Vanilla Token Relay: hauberk sends HTTP
     *                         Basic with client_id:client_secret;
     *                         gateway runs the client_credentials grant
     *                         on the hauberk's behalf and caches the
     *                         result per client_id.
     *   phantom            -- Phantom Token Relay: hauberk sends Bearer
     *                         (KC JWT); gateway runs RFC 8693
     *                         token-exchange via its dedicated exchange
     *                         client and caches per source-token jti.
     * Sourced from `tokenRelay.type` in the properties file. Maps to a
     * transport choice (Basic for vanilla, Bearer otherwise) consumed
     * by HauberkSimulation + HealthPreCheck through isBasicAuth().
     */
    public static final String TOKEN_RELAY_TYPE;

    /** Pre-computed Authorization header value for vanilla (Basic) mode
     *  (static because client_id + secret are config-time constants).
     *  null when TOKEN_RELAY_TYPE != "vanilla". */
    private static final String BASIC_AUTH_HEADER;

    /** Playground parent ORG id -- where every hauberk-created office /
     *  user / account roots itself. The Test Driver service-accounts
     *  (uid=15 esq-hauberk, uid=16 esq-hauberk-S) have esq_rootpath="1.14.",
     *  so the hauberk can only create entities under Test House (org 14).
     *  Sourced from hauberk.properties `playground.parent.id`. */
    public static final String PLAYGROUND_PARENT_ID;

    public static final int PREPARE_OFFICES_DEPTH;
    public static final int PREPARE_CLIENTS_PER_OFFICE;
    public static final int PREPARE_ACCOUNTS_PER_CLIENT;

    public static final int MOVE_OFFICES_DEPTH;
    public static final int MOVE_CLIENTS_PER_OFFICE;
    public static final int MOVE_ACCOUNTS_PER_CLIENT;

    public static final int SUPER_DURATION_SECONDS;
    public static final int SUPER_READ_WORKERS;
    public static final int SUPER_UPDATE_WORKERS;
    public static final int SUPER_CREATE_WORKERS;
    public static final int SUPER_MOVE_WORKERS;
    public static final int SUPER_TX_WORKERS;

    /** Infra-orchestration shell commands (key -> command line), from the cmd.* properties.
     *  Run as sim steps via Cmd.run("key"); -Dcmd.key=... overrides at the CLI. */
    private static final java.util.Map<String, String> COMMANDS;

    /**
     * Performance-metrics matrix capture (X-Capture-Metrics trigger). Off by
     * default; flipped on via system property hauberk.metrics=true (hauberk.cmd
     * --metrics). When on, every HTTP request from a Simulation that has been
     * wrapped via PerformanceMatrix.instrument(httpProtocol) carries the
     * trigger header, the gateway returns X-Response-Time / Esq-Service-Time
     * / Esq-Backend-Time in response headers, and PerformanceMatrix appends
     * a CSV row plus prints a tail-of-run summary.
     */
    public static final boolean METRICS_ENABLED =
        Boolean.parseBoolean(System.getProperty("hauberk.metrics", "false"));

    static {
        Properties p = new Properties();
        // Always load the base file -- contains canonical settings.
        try (InputStream in = new FileInputStream(BASE_CONFIG_FILE)) {
            p.load(in);
        } catch (IOException e) {
            throw new RuntimeException(
                "Cannot read hauberk base config file '" + BASE_CONFIG_FILE
                + "' (working dir: " + System.getProperty("user.dir") + ")", e);
        }
        // Overlay -- only if a different file was named via hauberk.config.
        if (!BASE_CONFIG_FILE.equals(CONFIG_FILE)) {
            try (InputStream in = new FileInputStream(CONFIG_FILE)) {
                p.load(in);
            } catch (IOException e) {
                throw new RuntimeException(
                    "Cannot read hauberk overlay config file '" + CONFIG_FILE
                    + "' (working dir: " + System.getProperty("user.dir") + ")", e);
            }
        }
        KC_BASE          = require(p, "kc.base");
        KC_REALM         = require(p, "kc.realm");
        KC_CLIENT_ID     = require(p, "kc.client.id");
        KC_CLIENT_SECRET = require(p, "kc.client.secret");
        GW_BASE          = require(p, "gw.base");
        BFF_BASE         = require(p, "bff.base");
        ENYMAN_BASE      = require(p, "enyman.base");

        KC_ADMIN_USER     = p.getProperty("kc.admin.user", "admin");
        KC_ADMIN_PASSWORD = p.getProperty("kc.admin.password", "q");

        PG_URL      = p.getProperty("pg.url", "");
        PG_USER     = p.getProperty("pg.user", "esq2025");
        PG_PASSWORD = p.getProperty("pg.password", "");

        TOKEN_RELAY_TYPE = optionalLowercase(p, "tokenRelay.type", "plain");
        if (!"plain".equals(TOKEN_RELAY_TYPE)
                && !"vanilla".equals(TOKEN_RELAY_TYPE)
                && !"phantom".equals(TOKEN_RELAY_TYPE)) {
            throw new IllegalStateException(
                "Setting 'tokenRelay.type' must be 'plain', 'vanilla', or 'phantom' (got: "
                + TOKEN_RELAY_TYPE + ")");
        }
        if ("vanilla".equals(TOKEN_RELAY_TYPE)) {
            String creds = KC_CLIENT_ID + ":" + KC_CLIENT_SECRET;
            BASIC_AUTH_HEADER = "Basic " + Base64.getEncoder().encodeToString(
                creds.getBytes(StandardCharsets.UTF_8));
        } else {
            BASIC_AUTH_HEADER = null;
        }

        PLAYGROUND_PARENT_ID = require(p, "playground.parent.id");

        // Prepare-shape knobs allow 0 (e.g. 0 accounts per client = users only).
        PREPARE_OFFICES_DEPTH         = requireInt(p,     "prepare.offices.depth");
        PREPARE_CLIENTS_PER_OFFICE    = requireIntMin0(p, "prepare.clients.per.office");
        PREPARE_ACCOUNTS_PER_CLIENT   = requireIntMin0(p, "prepare.accounts.per.client");

        // Move-shape: depth must be >=3 (need L1/L2/L3 distinct positions).
        MOVE_OFFICES_DEPTH            = requireIntMin(p, "move.offices.depth", 3);
        MOVE_CLIENTS_PER_OFFICE       = requireInt(p,    "move.clients.per.office");
        MOVE_ACCOUNTS_PER_CLIENT      = requireIntMin0(p,"move.accounts.per.client");

        // SuperLoad: duration >= 1; workers >= 0 (0 disables that scenario).
        // SuperLoadSimulation enforces "at least one workers > 0" at runtime.
        SUPER_DURATION_SECONDS        = requireIntMin(p, "super.duration.seconds", 1);
        SUPER_READ_WORKERS            = requireIntMin0(p,"super.read.workers");
        SUPER_UPDATE_WORKERS          = requireIntMin0(p,"super.update.workers");
        SUPER_CREATE_WORKERS          = requireIntMin0(p,"super.create.workers");
        SUPER_MOVE_WORKERS            = requireIntMin0(p,"super.move.workers");
        SUPER_TX_WORKERS              = requireIntMin0(p,"super.tx.workers");

        java.util.Map<String, String> cmds = new java.util.HashMap<>();
        for (String name : p.stringPropertyNames()) {
            if (name.startsWith("cmd.")) {
                cmds.put(name.substring("cmd.".length()), p.getProperty(name).trim());
            }
        }
        COMMANDS = java.util.Map.copyOf(cmds);
    }

    /** The configured infra command for {@code key} (cmd.&lt;key&gt; in the properties);
     *  {@code -Dcmd.<key>=...} overrides. Throws if neither is set. */
    public static String command(String key) {
        String sys = System.getProperty("cmd." + key);
        if (sys != null && !sys.isBlank()) {
            return sys.trim();
        }
        String ret = COMMANDS.get(key);
        if (ret == null || ret.isBlank()) {
            throw new IllegalStateException("Missing command 'cmd." + key + "' in " + CONFIG_FILE);
        }
        return ret;
    }

    public static String tokenEndpoint() {
        String ret = KC_BASE + "/realms/" + KC_REALM + "/protocol/openid-connect/token";
        return ret;
    }

    /** True when tokenRelay.type = "vanilla" -- the hauberk presents
     *  HTTP Basic at the gateway edge (gateway exchanges to a JWT). */
    public static boolean isBasicAuth() {
        return "vanilla".equals(TOKEN_RELAY_TYPE);
    }

    /** Pre-computed "Basic base64(id:secret)" header value. Throws when
     *  the run isn't a Vanilla Token Relay run -- callers should branch
     *  on {@link #isBasicAuth()} before reading this. */
    public static String basicAuthHeader() {
        if (BASIC_AUTH_HEADER == null) {
            throw new IllegalStateException(
                "basicAuthHeader() called but tokenRelay.type=" + TOKEN_RELAY_TYPE);
        }
        return BASIC_AUTH_HEADER;
    }

    private static String optionalLowercase(Properties p, String key, String defaultValue) {
        String sys = System.getProperty(key);
        if (sys != null && !sys.isBlank()) {
            return sys.trim().toLowerCase();
        }
        String raw = p.getProperty(key);
        if (raw == null || raw.isBlank()) {
            return defaultValue;
        }
        return raw.trim().toLowerCase();
    }

    private static String require(Properties p, String key) {
        // System property wins over the file: -D{key}=... lets the
        // CLI override the value. Useful for parameter sweeps without
        // editing hauberk.properties on every run.
        String sys = System.getProperty(key);
        if (sys != null && !sys.isBlank()) {
            return sys;
        }
        String ret = p.getProperty(key);
        if (ret == null || ret.isBlank()) {
            throw new IllegalStateException(
                "Missing required setting '" + key + "' in " + CONFIG_FILE);
        }
        return ret;
    }

    private static int requireInt(Properties p, String key) {
        String raw = require(p, key);
        try {
            int ret = Integer.parseInt(raw.trim());
            if (ret < 1) {
                throw new IllegalStateException(
                    "Setting '" + key + "' must be a positive integer (got: " + raw + ")");
            }
            return ret;
        } catch (NumberFormatException e) {
            throw new IllegalStateException(
                "Setting '" + key + "' must be a positive integer (got: " + raw + ")", e);
        }
    }

    private static int requireIntMin0(Properties p, String key) {
        String raw = require(p, key);
        try {
            int ret = Integer.parseInt(raw.trim());
            if (ret < 0) {
                throw new IllegalStateException(
                    "Setting '" + key + "' must be >= 0 (got: " + raw + ")");
            }
            return ret;
        } catch (NumberFormatException e) {
            throw new IllegalStateException(
                "Setting '" + key + "' must be an integer (got: " + raw + ")", e);
        }
    }

    private static int requireIntMin(Properties p, String key, int min) {
        String raw = require(p, key);
        try {
            int ret = Integer.parseInt(raw.trim());
            if (ret < min) {
                throw new IllegalStateException(
                    "Setting '" + key + "' must be >= " + min + " (got: " + raw + ")");
            }
            return ret;
        } catch (NumberFormatException e) {
            throw new IllegalStateException(
                "Setting '" + key + "' must be an integer (got: " + raw + ")", e);
        }
    }
}
