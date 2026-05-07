import { Component } from '@angular/core';

@Component({
  selector: 'app-celebrity',
  imports: [],
  templateUrl: './celebrity.html',
  styleUrl: './celebrity.scss',
})
export class Celebrity {
  public path: string = './mock/home/musicbar/image 1.png';

  public celebrities = [
    { name: 'Justin Bieber', career: '歌手', path: './mock/home/celebrity/img-1.png' },
    { name: 'Billie Eilish', career: '歌手', path: './mock/home/celebrity/img-2.png' },
    { name: '周杰倫', career: '歌手', path: './mock/home/celebrity/img-3.png' },
    { name: 'Ardie Son', career: '作曲家', path: './mock/home/celebrity/img-4.png' },
    { name: 'IVE', career: '團體歌手', path: './mock/home/celebrity/img-5.png' },
  ];

  printImage(path: string) {
    this.path = path;
  }
}
