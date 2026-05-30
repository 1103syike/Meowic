import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../@service/auth.service';

async function canOpenCms(): Promise<boolean> {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.waitForAuthReady();

  if (!auth.isAuthenticated()) {
    showDenied('請先登入', '登入後才可以進入 CMS。');
    router.navigate(['/']);
    return false;
  }

  if (auth.canAccessCms()) {
    return true;
  }

  const userRequest = auth.getUserInfo();
  const user = userRequest ? (await firstValueFrom(userRequest))[0] : null;

  if (auth.canUserAccessCms(user)) {
    auth.user.set(user);
    return true;
  }

  showDenied('沒有 CMS 權限', '目前帳號沒有後台管理權限。');
  router.navigate(['/']);
  return false;
}

function showDenied(title: string, text: string): void {
  Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: '知道了',
  });
}

export const cmsCanMatchGuard: CanMatchFn = () => canOpenCms();
export const cmsCanActivateGuard: CanActivateFn = () => canOpenCms();
export const cmsCanActivateChildGuard: CanActivateChildFn = () => canOpenCms();
