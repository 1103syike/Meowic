import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiService, UserType } from '../../../@service/api.service';
import { AuthService } from '../../../@service/auth.service';
import { getCmsErrorMessage, showCmsError, showCmsSuccess } from '../cms-feedback';

@Component({
  selector: 'app-cms-users',
  imports: [FormsModule],
  templateUrl: './cms-users.html',
  styleUrl: './cms-users.scss',
})
export class CmsUsers {
  private api: ApiService = inject(ApiService);
  private auth: AuthService = inject(AuthService);
  private readonly protectedEmails = new Set(['dandy', 'wendy']);

  public users = signal<UserType[]>([]);
  public selectedUser = signal<UserType | null>(null);
  public isCreating = signal(false);
  public isSaving = signal(false);
  public message = signal('');

  public editForm = this.getEmptyForm();

  ngOnInit() {
    this.loadUsers();
  }

  public startCreateUser(): void {
    this.selectedUser.set(null);
    this.isCreating.set(true);
    this.message.set('');
    this.editForm = this.getEmptyForm();
  }

  public selectUser(user: UserType): void {
    this.selectedUser.set(user);
    this.isCreating.set(false);
    this.message.set('');
    this.editForm = {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role ?? 'user',
      canAccessCms: !!user.canAccessCms,
    };
  }

  public hasPendingChanges(): boolean {
    const user = this.selectedUser();
    if (this.isCreating()) {
      return Object.values(this.editForm).some((value) => !!value);
    }

    if (!user) {
      return false;
    }

    return (
      this.editForm.name !== user.name ||
      this.editForm.email !== user.email ||
      this.editForm.password !== user.password ||
      this.editForm.role !== (user.role ?? 'user') ||
      this.editForm.canAccessCms !== !!user.canAccessCms
    );
  }

  public cancelChanges(): void {
    const user = this.selectedUser();
    if (this.isCreating()) {
      this.isCreating.set(false);
      this.editForm = this.getEmptyForm();
      this.message.set('已取消新增帳號');
      return;
    }

    if (user) {
      this.selectUser(user);
      this.message.set('已取消未儲存變更');
    }
  }

  public async saveUser(): Promise<void> {
    if (!this.editForm.name.trim() || !this.editForm.email.trim() || !this.editForm.password) {
      this.message.set('請填寫名稱、帳號與密碼');
      await showCmsError('儲存失敗', '請填寫名稱、帳號與密碼');
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      if (this.isCreating()) {
        await firstValueFrom(
          this.api.createUser({
            name: this.editForm.name.trim(),
            email: this.editForm.email.trim(),
            password: this.editForm.password,
            role: this.editForm.role,
            canAccessCms: this.editForm.canAccessCms,
          }),
        );
        this.isCreating.set(false);
        this.message.set('使用者已新增');
        await showCmsSuccess('使用者已新增');
      } else {
        const user = this.selectedUser();
        if (!user) {
          return;
        }

        await firstValueFrom(
          this.api.updateUser(user.id, {
            name: this.editForm.name.trim(),
            email: this.editForm.email.trim(),
            password: this.editForm.password,
            role: this.editForm.role,
            canAccessCms: this.editForm.canAccessCms,
          }),
        );
        this.message.set('使用者資料已更新');
        await showCmsSuccess('使用者資料已更新');
      }

      await this.loadUsers();
    } catch (err) {
      console.error('CMS 儲存使用者失敗：', err);
      const message = getCmsErrorMessage(err, '儲存失敗，請稍後再試');
      this.message.set(message);
      await showCmsError('儲存失敗', message);
    } finally {
      this.isSaving.set(false);
    }
  }

  public async deleteUser(): Promise<void> {
    const user = this.selectedUser();
    if (!user) {
      return;
    }

    if (!this.canDeleteUser(user)) {
      this.message.set('這個帳號受到保護，不能刪除');
      return;
    }

    const result = await Swal.fire({
      title: '刪除使用者？',
      text: `確定要刪除 ${user.name} 嗎？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      await firstValueFrom(this.api.deleteUser(user.id));
      this.selectedUser.set(null);
      await this.loadUsers();
      this.message.set('使用者已刪除');
      await showCmsSuccess('使用者已刪除');
    } catch (err) {
      console.error('CMS 刪除使用者失敗：', err);
      const message = getCmsErrorMessage(err, '刪除失敗，請稍後再試');
      this.message.set(message);
      await showCmsError('刪除失敗', message);
    } finally {
      this.isSaving.set(false);
    }
  }

  public canDeleteUser(user: UserType | null): boolean {
    if (!user) {
      return false;
    }

    const email = user.email.trim().toLowerCase();
    return !this.protectedEmails.has(email) && user.id !== this.auth.user()?.id;
  }

  private async loadUsers(): Promise<void> {
    const users = await firstValueFrom(this.api.getAllUsers());
    this.users.set(users);

    const current = this.selectedUser();
    if (current) {
      const refreshed = users.find((user) => user.id === current.id);
      if (refreshed) {
        this.selectUser(refreshed);
      }
    } else if (!this.isCreating() && users.length) {
      this.selectUser(users[0]);
    }
  }

  private getEmptyForm() {
    return {
      name: '',
      email: '',
      password: '123',
      role: 'user',
      canAccessCms: false,
    };
  }
}
