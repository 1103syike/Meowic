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
  public isAddSongDialogOpen = signal(false);
  public isSaving = signal(false);
  public songs = signal<SongType[]>([]);
  public selectedSong = signal<SongType | null>(null);
  public message = signal('');

  public editForm = {
    name: '',
    artistId: 0,
    albumId: 0,
  };

  private imageFile: File | null = null;

  public selectedSongImage = computed(() => {
    const song = this.selectedSong();
    return song?.imgPath || song?.album?.imgPath || './mock/unnamed.png';
  });

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
    this.message.set('');
    this.imageFile = null;
    this.editForm = {
      name: song.name,
      artistId: song.artistId ?? song.artist?.id ?? 0,
      albumId: song.albumId ?? song.album?.id ?? 0,
    };
  }

  public setImageFile(event: Event): void {
    this.imageFile = (event.target as HTMLInputElement).files?.[0] ?? null;
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
