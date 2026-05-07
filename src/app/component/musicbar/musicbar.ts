import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-musicbar',
  imports: [MatIconModule],
  templateUrl: './musicbar.html',
  styleUrl: './musicbar.scss',
    host: {
    'class': 'musicbar' //
  }
})
export class Musicbar {}
