# explorer — Unit Test Structure

## group1 — Pure Logic
No Angular, no mocks. Direct instantiation only.
Tests: pure methods, namespace constants, utility functions.
Run time: fast. No async setup.

## group2 — Mock Dependencies
No TestBed. Constructor-injected stubs via jasmine.createSpyObj.
Tests: command handler routing, service behavior with a fake REST layer.

## group3 — Angular Components (TestBed)
Full TestBed fixture. Requires provideRouter([]) for AppComponent;
NoopAnimationsModule + KEYCLOAK_EVENT_SIGNAL mock for ExplorerComponent.
Tests: component creation, title binding, key wiring.

## run app level tests
call ng run client:test-app --watch=false --browsers=ChromeHeadless
