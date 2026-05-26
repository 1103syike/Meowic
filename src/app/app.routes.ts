import { Routes } from '@angular/router';
import {
  cmsCanActivateChildGuard,
  cmsCanActivateGuard,
  cmsCanMatchGuard,
} from './@guard/cms.guard';

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
        path: 'artist/:id',
        data: { pageName: '藝人' },
        loadComponent: () => import('./view/artist/artist').then((m) => m.Artist),
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
        path: 'popular',
        data: { pageName: '熱門歌曲' },
        loadComponent: () => import('./view/popular/popular').then((m) => m.Popular),
      },
      {
        path: 'new-songs',
        data: { pageName: '新增歌曲' },
        loadComponent: () => import('./view/new-songs/new-songs').then((m) => m.NewSongs),
      },
      {
        path: 'search',
        data: { pageName: '搜尋' },
        loadComponent: () =>
          import('./component/search-results/search-results').then((m) => m.SearchResults),
      },
      {
        path: 'cms',
        data: { pageName: 'CMS' },
        canMatch: [cmsCanMatchGuard],
        canActivate: [cmsCanActivateGuard],
        canActivateChild: [cmsCanActivateChildGuard],
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
            path: 'home',
            loadComponent: () =>
              import('./view/cms/home-recommendations/cms-home-recommendations').then(
                (m) => m.CmsHomeRecommendations,
              ),
          },
          {
            path: 'ads',
            loadComponent: () => import('./view/cms/ads/cms-ads').then((m) => m.CmsAds),
          },
          {
            path: 'albums',
            loadComponent: () =>
              import('./view/cms/albums/cms-albums').then((m) => m.CmsAlbums),
          },
          {
            path: 'users',
            loadComponent: () => import('./view/cms/users/cms-users').then((m) => m.CmsUsers),
          },
        ],
      },
    ],
  },
];
