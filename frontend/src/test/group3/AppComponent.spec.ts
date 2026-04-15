/**
*  Esquire frameworks (tm)
*
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
* History :
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from 'src/app/app.component';

describe('AppComponent', () => {
    var fixture: ComponentFixture<AppComponent>;
    var component: AppComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    });

    it('creates without error', () => {
        expect(component).toBeTruthy();
    });

    it('has correct title', () => {
        expect(component.title).toBe('Esquire Explorer');
    });
});
