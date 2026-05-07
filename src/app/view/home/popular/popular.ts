import { Component } from '@angular/core';

@Component({
  selector: 'app-popular',
  imports: [],
  templateUrl: './popular.html',
  styleUrl: './popular.scss',
})
export class Popular {

    public populars = [
    { title: 'Dirty Work', artist: 'aespa', path: './mock/home/popular/img-1.png' },
    { title: 'That Should Be Me', artist: 'Justin Bieber', path: './mock/home/popular/img-2.png' },
    { title: '心悶', artist: '美秀集團', path: './mock/home/popular/img-3.png' },
    { title: 'Speechless', artist: 'Naomi Scott', path: './mock/home/popular/img-4.png' },
    { title: 'Odd Eyes', artist: 'Dreamcatcher', path: './mock/home/popular/img-5.png' },

  ];
}
