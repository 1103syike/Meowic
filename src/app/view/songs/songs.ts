import { Component } from '@angular/core';
import { SongList } from '../../component/song-list/song-list';

@Component({
  selector: 'app-songs',
  imports: [SongList],
  templateUrl: './songs.html',
  styleUrl: './songs.scss',
})
export class Songs {}
