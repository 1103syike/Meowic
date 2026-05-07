import { Component } from '@angular/core';
import { Recommand } from "./recommand/recommand";
import { Popular } from "./popular/popular";
import { Celebrity } from "./celebrity/celebrity";

@Component({
  selector: 'app-home',
  imports: [Recommand, Popular, Celebrity],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
