<table style="width: 100%; table-layout: fixed;">
  <tr>
    <td style="width: 12%"><img src="./favicon.ico" alt="Esquire logo" align="right" valign="middle" width="64"></td>
    <td style="width: 88%;">
       <h1>Esquire Application Frameworks(tm) 2.0</h1>
    </td>
  </tr>
</table>

Frameworks for organizing business entities in a tree, for any business or activity. They cover the
usual work of a back-office system: onboarding, user profiles, permissions, authorization, and
accounting.

## esquire.explorer -- the front yard of Esquire

This repository holds the tools that sit OUTSIDE the Esquire server and call it the way any outside
caller would. The server itself is the [Esquire services](https://github.com/mir0n-pro/esquire.services)
repository.

It is not a single product. Four subprojects share one home, one build chain, and the same generated
REST clients. Each one is built, run, and deployed on its own.

The cost is one more tier on the way in: the browser never talks to the server directly, it goes
through the backend.

---
>
> **v2.0.0 -- the load harness leaves the explorer.** The harness is a product of its own now,
> `armoury-hauberk` in [Armoury](https://github.com/mir0n-pro/armoury), and the Esquire load tests
> moved to the Esquire services repository. See [Release History](#release-history).
>
> The 1.2 line goes on in parallel. Its last release is
> [v1.2.16](https://github.com/mir0n-pro/esquire.explorer/tree/release/v1.2.16?tab=readme-ov-file).

---

## Running it

Node.js 22. The Esquire server stack must be running first: Keycloak, the gateway, and the services.

```
run.all.bat
```

This opens two console windows:

| Window | Address | What it is |
|---|---|---|
| `esquire-backend` | http://localhost:3000 | The backend, in watch mode |
| `esquire-frontend` | http://localhost:4200 | The Angular dev server; it passes `/api` and `/auth` to the backend |

`run.backend.bat` and `run.frontend.bat` start one side each. On docker and k8s the backend and the
frontend ship together, as one image.

---

## Project Structure

| Project | Description |
|---|---|
| [frontend](frontend) | The Esquire Tree Explorer: an Angular app that shows the entity tree, the details of an entity, and the commands on it. Its screens come from the [Esquire UI library](https://github.com/mir0n-pro/esquire.ui.lib) |
| [backend](backend) | A Node.js backend for the browser. It runs the Keycloak login on the server side and keeps the tokens there; the browser holds only a session cookie. It passes each request on to the gateway with the token, and serves the frontend |
| [openapi-generate](openapi-generate) | The REST API description and the templates that generate the typed clients the other projects use |
| [e2e-test](e2e-test) | The Playwright browser tests. They drive the frontend, the backend, and the gateway in a real browser |

---

## Release History

**[release_notes.txt](doc/release_notes.txt)** -- the release notes, newest first.

---

## Documentation

- [Frontend](frontend/README.md) *(the Tree Explorer, what comes from the UI library, how to build
  and run it, and the login flow)*
- [Backend](backend/README.md) *(the login flow, the token forwarding, and the settings)*
- [e2e test scope](e2e-test/e2e-test.scope.md) *(what each browser test covers, and what it needs to
  run)*
- [e2e test, open work](doc/e2e.todo.md) *(changes that would make the browser tests steadier)*

---

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
