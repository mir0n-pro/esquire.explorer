# esquire.ui — Unit Test Structure

## group1 — Pure Logic
No Angular, no mocks. Direct class instantiation only.
Tests: pure methods, signal initialization, static factories, utility functions.
Run time: fast. No async setup.

## group2 — Mock Dependencies
No TestBed. Constructor-injected stubs via jasmine.createSpyObj.
Tests: Observable pipelines, caching/dedup logic, datasource behavior with a fake REST layer.

## group3 — Angular Components (TestBed)
Full TestBed fixture. Requires NoopAnimationsModule + MatDialogRef/MAT_DIALOG_DATA providers.
Tests: component creation, key UI interactions, dialog close results.

## run esquire.ui tests
call ng run client:test-ui --watch=false --browsers=ChromeHeadless
