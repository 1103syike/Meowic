import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AlbumType, ApiService, ArtistType, SongType } from '../../../@service/api.service';
import { AddSongDialog } from '../../../component/add-song-dialog/add-song-dialog';

@Component({
  selector: 'app-cms-songs',
  imports: [AddSongDialog, FormsModule],
  templateUrl: './cms-songs.html',
  styleUrl: './cms-songs.scss',
})
export class CmsSongs {
  private api: ApiService = inject(ApiService);

  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public imagePreview = signal('');
  public isAddSongDialogOpen = signal(false);
  public isSaving = signal(false);
  public songs = signal<SongType[]>([]);
  public selectedSong = signal<SongType | null>(null);
  public message = signal('');
  public keyword = signal('');
  public page = signal(1);
  public readonly pageSize = 8;

  public editForm = {
    name: '',
    artistId: 0,
    albumId: 0,
  };

  private imageFile: File | null = null;

  public selectedSongImage = computed(() => {
    const song = this.selectedSong();
    return this.imagePreview() || song?.imgPath || song?.album?.imgPath || './mock/unnamed.png';
  });

  public filteredSongs = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    if (!keyword) return this.songs();

    return this.songs().filter((song) =>
      [song.name, song.artist?.name, song.album?.name].some((value) =>
        (value ?? '').toLowerCase().includes(keyword),
      ),
    );
  });

  public pagedSongs = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredSongs().slice(start, start + this.pageSize);
  });

  public pageCount = computed(() => Math.max(1, Math.ceil(this.filteredSongs().length / this.pageSize)));

  public hasPendingChanges(): boolean {
    const song = this.selectedSong();
    if (!song) {
      return false;
    }

    return (
      !!this.imagePreview() ||
      this.editForm.name !== song.name ||
      Number(this.editForm.artistId) !== (song.artistId ?? song.artist?.id ?? 0) ||
      Number(this.editForm.albumId) !== (song.albumId ?? song.album?.id ?? 0)
    );
  }

  ngOnInit() {
    this.loadData();
  }

  public openAddSongDialog(): void {
    this.isAddSongDialogOpen.set(true);
  }

  public closeAddSongDialog(): void {
    this.isAddSongDialogOpen.set(false);
  }

  public handleSongCreated(): void {
    this.loadData();
  }

  public selectSong(song: SongType): void {
    this.selectedSong.set(song);
    this.resetEditor(song);
  }

  public setKeyword(keyword: string): void {
    this.keyword.set(keyword);
    this.page.set(1);
  }

  public changePage(direction: -1 | 1): void {
    this.page.update((page) => Math.min(Math.max(page + direction, 1), this.pageCount()));
  }

  public async setImageFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview.set(file ? await this.readFileAsDataUrl(file) : '');
    this.message.set(file ? '圖片已預覽，按下儲存後才會更新' : '');
  }

  public cancelChanges(): void {
    const song = this.selectedSong();
    if (song) {
      this.resetEditor(song);
      this.message.set('已取消未儲存變更');
    }
  }

  public async saveSong(): Promise<void> {
    const song = this.selectedSong();
    if (!song || !this.editForm.name.trim() || !this.editForm.artistId || !this.editForm.albumId) {
      this.message.set('請填寫歌名、歌手與專輯');
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      const imgPath = this.imageFile ? await this.uploadImage(this.imageFile) : song.imgPath;
      await firstValueFrom(
        this.api.updateSong(song.id, {
          name: this.editForm.name.trim(),
          artistId: Number(this.editForm.artistId),
          albumId: Number(this.editForm.albumId),
          ...(imgPath ? { imgPath } : {}),
        }),
      );
      await this.loadData();
      this.message.set('歌曲已更新');
    } catch (err) {
      console.error('CMS 更新歌曲失敗：', err);
      this.message.set('更新失敗，請稍後再試');
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetEditor(song: SongType): void {
    this.message.set('');
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = {
      name: song.name,
      artistId: song.artistId ?? song.artist?.id ?? 0,
      albumId: song.albumId ?? song.album?.id ?? 0,
    };
  }

  private async loadData(): Promise<void> {
    const [songs, albums, artists] = await Promise.all([
      firstValueFrom(this.api.getAllSong()),
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllArtist()),
    ]);
    this.songs.set(songs);
    this.albums.set(albums.filter((album) => album.type === 'album'));
    this.artists.set(artists);

    const current = this.selectedSong();
    if (current) {
      const refreshed = songs.find((song) => song.id === current.id);
      if (refreshed) {
        this.selectSong(refreshed);
      }
    } else if (songs.length) {
      this.selectSong(songs[0]);
    }

    this.page.set(Math.min(Math.max(this.page(), 1), this.pageCount()));
  }

  private async uploadImage(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);
    const result = await firstValueFrom(this.api.uploadFile(file.name, dataUrl, file.type));
    return result.path;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
