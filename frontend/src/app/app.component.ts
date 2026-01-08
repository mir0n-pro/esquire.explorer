/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 01/98/2026 mir0n log keycloak initialization
*/
import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEvent, KeycloakEventType  } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'Esquire Explorer';
  
  keycloakSignal: Signal<KeycloakEvent> = inject(KEYCLOAK_EVENT_SIGNAL);
   accessToken = signal<string | undefined>(undefined);

  ngOnInit() {
    // This property is what the interceptor checks


    const event = this.keycloakSignal();
    console.log('Is Authenticated?', event);
      
      if (event?.type === KeycloakEventType.Ready || 
          event?.type === KeycloakEventType.AuthSuccess) {
        const instance = event.args as any;

        //instance.updateToken(30).then(() => {
        //    console.log('Token refreshed:', instance.token);
        //}).catch(() => {
        //    console.error('Failed to refresh token');
        //});

        if (instance.token) {
          this.accessToken.set(instance.token);
          console.log('Current Token:', this.accessToken());
        } else {
          console.warn('No token found in Keycloak instance.');
        }
      }
  }
}
