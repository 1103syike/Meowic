import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AlbumType, ApiService, ArtistType, SongType } from '../../@service/api.service';
import { confirmCmsAction, getCmsErrorMessage, showCmsError, showCmsSuccess } from './cms-feedback';

@Injectable({ providedIn: 'root' })
export class CatalogCmsActions {
  private readonly api = inject(ApiService);

  async unpublishSong(song: SongType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '下架歌曲？',
      text: `「${song.name}」將從前台隱藏，資料與檔案仍保留，之後可重新上架並更換音檔或封面。`,
      confirmButtonText: '下架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.unpublishSong(song.id));
      await onDone();
      await showCmsSuccess('歌曲已下架');
    } catch (err) {
      await showCmsError('下架失敗', getCmsErrorMessage(err));
    }
  }

  async republishSong(song: SongType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '重新上架歌曲？',
      text: `「${song.name}」將恢復前台顯示。若需要，請先更新音檔或封面後再儲存。`,
      confirmButtonText: '重新上架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.republishSong(song.id));
      await onDone();
      await showCmsSuccess('歌曲已重新上架');
    } catch (err) {
      await showCmsError('重新上架失敗', getCmsErrorMessage(err));
    }
  }

  async deleteSong(song: SongType, onDone: () => Promise<void>): Promise<void> {
    const blockers = await firstValueFrom(this.api.getSongDeleteBlockers(song.id));
    if (blockers.length) {
      await showCmsError('無法刪除歌曲', blockers.join('\n'));
      return;
    }

    const confirmed = await confirmCmsAction({
      title: '刪除歌曲？',
      text: `「${song.name}」將從資料庫永久移除，此操作無法復原。`,
      requireTypedConfirm: '刪除',
      confirmButtonText: '永久刪除',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.deleteSong(song.id));
      await onDone();
      await showCmsSuccess('歌曲已刪除');
    } catch (err) {
      await showCmsError('刪除失敗', getCmsErrorMessage(err));
    }
  }

  async unpublishAlbum(album: AlbumType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '下架發行作品？',
      text: `「${album.name}」及其歌曲將無法在前台播放，資料仍保留，之後可重新上架並更換封面。`,
      confirmButtonText: '下架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.unpublishAlbum(album.id));
      await onDone();
      await showCmsSuccess('發行作品已下架');
    } catch (err) {
      await showCmsError('下架失敗', getCmsErrorMessage(err));
    }
  }

  async republishAlbum(album: AlbumType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '重新上架發行作品？',
      text: `「${album.name}」將恢復前台顯示。若需要，請先更新封面後再儲存。`,
      confirmButtonText: '重新上架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.republishAlbum(album.id));
      await onDone();
      await showCmsSuccess('發行作品已重新上架');
    } catch (err) {
      await showCmsError('重新上架失敗', getCmsErrorMessage(err));
    }
  }

  async deleteAlbum(album: AlbumType, onDone: () => Promise<void>): Promise<void> {
    const blockers = await firstValueFrom(this.api.getAlbumDeleteBlockers(album.id));
    if (blockers.length) {
      await showCmsError('無法刪除發行作品', blockers.join('\n'));
      return;
    }

    const confirmed = await confirmCmsAction({
      title: '刪除發行作品？',
      text: `「${album.name}」將從資料庫永久移除，此操作無法復原。`,
      requireTypedConfirm: '刪除',
      confirmButtonText: '永久刪除',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.deleteAlbum(album.id));
      await onDone();
      await showCmsSuccess('發行作品已刪除');
    } catch (err) {
      await showCmsError('刪除失敗', getCmsErrorMessage(err));
    }
  }

  async unpublishArtist(artist: ArtistType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '下架藝人？',
      text: `「${artist.name}」將從前台隱藏，資料仍保留，之後可重新上架並更換頭像。`,
      confirmButtonText: '下架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.unpublishArtist(artist.id));
      await onDone();
      await showCmsSuccess('藝人已下架');
    } catch (err) {
      await showCmsError('下架失敗', getCmsErrorMessage(err));
    }
  }

  async republishArtist(artist: ArtistType, onDone: () => Promise<void>): Promise<void> {
    const confirmed = await confirmCmsAction({
      title: '重新上架藝人？',
      text: `「${artist.name}」將恢復前台顯示。若需要，請先更新頭像後再儲存。`,
      confirmButtonText: '重新上架',
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.republishArtist(artist.id));
      await onDone();
      await showCmsSuccess('藝人已重新上架');
    } catch (err) {
      await showCmsError('重新上架失敗', getCmsErrorMessage(err));
    }
  }

  async deleteArtist(artist: ArtistType, onDone: () => Promise<void>): Promise<void> {
    const blockers = await firstValueFrom(this.api.getArtistDeleteBlockers(artist.id));
    if (blockers.length) {
      await showCmsError('無法刪除藝人', blockers.join('\n'));
      return;
    }

    const confirmed = await confirmCmsAction({
      title: '刪除藝人？',
      text: `「${artist.name}」將從資料庫永久移除，此操作無法復原。`,
      requireTypedConfirm: '刪除',
      confirmButtonText: '永久刪除',
    });
    if (!confirmed) return;

    try {
      await firstValueFrom(this.api.deleteArtist(artist.id));
      await onDone();
      await showCmsSuccess('藝人已刪除');
    } catch (err) {
      await showCmsError('刪除失敗', getCmsErrorMessage(err));
    }
  }
}
