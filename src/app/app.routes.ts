import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { pageName: '首頁' },
        loadComponent: () => import('./view/home/home').then((m) => m.Home),
      },
      {
        path: 'album/:id',
        data: { pageName: '專輯' },
        loadComponent: () =>
          import('./view/collectionDetail/collectionDetail').then(
            (m) => m.CollectionDetailComponent,
          ),
      },
      {
        path: 'playlist/:id',
        data: { pageName: '播放清單' },
        loadComponent: () =>
          import('./view/collectionDetail/collectionDetail').then(
            (m) => m.CollectionDetailComponent,
          ),
      },
      {
        path: 'song/:id',
        data: { pageName: '歌曲' },
        loadComponent: () => import('./view/song/song').then((m) => m.Song),
      },
      {
        path: 'songs',
        data: { pageName: '所有歌曲' },
        loadComponent: () => import('./view/songs/songs').then((m) => m.Songs),
      },
      {
        path: 'cms',
        data: { pageName: 'CMS' },
        loadComponent: () => import('./view/cms/cms').then((m) => m.Cms),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./view/cms/dashboard/cms-dashboard').then((m) => m.CmsDashboard),
          },
          {
            path: 'songs',
            loadComponent: () => import('./view/cms/songs/cms-songs').then((m) => m.CmsSongs),
          },
          {
            path: 'artists',
            loadComponent: () =>
              import('./view/cms/artists/cms-artists').then((m) => m.CmsArtists),
          },
          {
            path: 'albums',
            loadComponent: () =>
              import('./view/cms/albums/cms-albums').then((m) => m.CmsAlbums),
          },
        ],
      },
    ],
  },
];
