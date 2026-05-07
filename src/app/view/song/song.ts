import { Component } from '@angular/core';
import { Lyric } from "./lyric/lyric";
import { Artist } from "./artist/artist";

@Component({
  selector: 'app-song',
  imports: [Lyric, Artist],
  templateUrl: './song.html',
  styleUrl: './song.scss',
})
export class Song {}
