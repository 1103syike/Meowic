import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  imports: [MatIconModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  host: {
    'class': 'toolbar' // 
  }
})
export class Toolbar {}
