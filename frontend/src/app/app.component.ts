/*
*  Esquire frameworks (tm)
*  Esquire Explorer
*  Copyright(c) 2001, 2025 mir0n&co www.mir0n.me
*  mailto:mir0n.the.programmer@gmail.com
*
*  History:
* 01/98/2026 mir0n log keycloak initialization
* 01/10/2026 mir0n remove keycloakSignal
* 05/07/2026 mir0n  v1.2.3 BFF migration: remove keycloak-angular event handling (BFF tier owns auth)
*/
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'Esquire Explorer';

  ngOnInit() {
  }
}
