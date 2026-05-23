import { Component, Input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SongType } from '../../../@service/api.service';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
})
export class Artist {
  @Input() passedCurrentSong = signal<SongType | null>(null);
}
