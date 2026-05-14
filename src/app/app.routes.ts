import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { pageName: '首頁' },
        loadComponent: () => import('./view/home/home').then((m) => m.Home),
      },
      {
        path: 'album/:id',
        data: { pageName: '專輯' },
        loadComponent: () => import('./view/collectionDetail/collectionDetail').then((m) => m.CollectionDetailComponent),
      },
      {
        path: 'playlist/:id',
        data: { pageName: '播放清單' },
        loadComponent: () => import('./view/collectionDetail/collectionDetail').then((m) => m.CollectionDetailComponent),
      },
      {
        path: 'song/:id',
        data: { pageName: '歌曲' },
        loadComponent: () => import('./view/song/song').then((m) => m.Song),
      },
    ],
  },
];
