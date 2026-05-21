import Swal, { SweetAlertIcon } from 'sweetalert2';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { AuthService, LoginData, RegisterData } from '../../@service/auth.service';

type LoginMode = 'login' | 'register' | 'forgot' | 'terms' | 'privacy';
type ContactType = 'email' | 'phone';
type ForgotStep = 'request' | 'verify' | 'reset';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  @Output() close = new EventEmitter<void>();

  private auth: AuthService = inject(AuthService);

  public mode = signal<LoginMode>('login');
  public registerContactType = signal<ContactType>('email');
  public forgotStep = signal<ForgotStep>('request');
  public resetUserId = signal<number | null>(null);

  public loginForm = new FormGroup({
    account: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    otp: new FormControl('', { nonNullable: true }),
  });

  public registerForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  });

  public forgotForm = new FormGroup({
    contact: new FormControl('', { nonNullable: true }),
    code: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  });

  closingLoginDialog() {
    this.close.emit();
  }

  switchMode(mode: LoginMode) {
    this.mode.set(mode);

    if (mode === 'forgot') {
      this.forgotStep.set('request');
      this.resetUserId.set(null);
    }
  }

  setRegisterContactType(type: ContactType) {
    this.registerContactType.set(type);
    this.registerForm.patchValue(type === 'email' ? { phone: '' } : { email: '' });
  }

  showAlert(title: string, icon: SweetAlertIcon, text: string) {
    Swal.fire({ title, text, icon });
  }

  sendLoginOtp() {
    const account = this.loginForm.controls.account.value.trim();

    if (!account) {
      this.showAlert('提醒', 'warning', '請先輸入帳號，再取得驗證碼。');
      return;
    }

    this.showAlert('驗證碼已送出', 'success', '這是展示流程，輸入任何驗證碼都可以登入。');
  }

  onLogin() {
    const { account, password, otp } = this.loginForm.getRawValue();

    if (!account.trim() || !password.trim()) {
      this.showAlert('錯誤', 'error', '請輸入帳號與密碼。');
      return;
    }

    if (!otp.trim()) {
      this.showAlert('錯誤', 'error', '請輸入 OTP 或驗證碼。');
      return;
    }

    this.auth.login({ account: account.trim(), password } as LoginData).subscribe({
      next: (res) => {
        this.showAlert('歡迎', 'success', '登入成功');
        this.closingLoginDialog();
        this.auth.handleLoginSuccess(res.accessToken);
        this.auth.getUserInfo();
      },
      error: () => {
        this.showAlert('錯誤', 'error', '帳號或密碼錯誤。');
      },
    });
  }

  onRegister() {
    const formValue = this.registerForm.getRawValue();
    const contactType = this.registerContactType();
    const contact = contactType === 'email' ? formValue.email.trim() : formValue.phone.trim();

    if (!formValue.name.trim() || !contact || !formValue.password.trim()) {
      this.showAlert('錯誤', 'error', '請填寫暱稱、登入方式與密碼。');
      return;
    }

    if (formValue.password !== formValue.confirmPassword) {
      this.showAlert('錯誤', 'error', '兩次輸入的密碼不一致。');
      return;
    }

    this.auth.getUserByIdentifier(contact).subscribe((users) => {
      if (users.length) {
        this.showAlert('無法註冊', 'error', '這個手機或信箱已經被使用。');
        return;
      }

      const payload: RegisterData = {
        name: formValue.name.trim(),
        email: contactType === 'email' ? contact : '',
        phone: contactType === 'phone' ? contact : '',
        password: formValue.password,
        role: 'user',
        canAccessCms: false,
      };

      this.auth.register(payload).subscribe({
        next: () => {
          this.showAlert('註冊成功', 'success', '請使用剛建立的帳號登入。');
          this.loginForm.patchValue({ account: contact, password: '', otp: '' });
          this.registerForm.reset();
          this.switchMode('login');
        },
        error: () => {
          this.showAlert('錯誤', 'error', '註冊失敗，請稍後再試。');
        },
      });
    });
  }

  sendResetCode() {
    const contact = this.forgotForm.controls.contact.value.trim();

    if (!contact) {
      this.showAlert('提醒', 'warning', '請輸入註冊時使用的手機或信箱。');
      return;
    }

    this.auth.getUserByIdentifier(contact).subscribe((users) => {
      if (!users.length) {
        this.showAlert('找不到帳號', 'error', '請確認手機或信箱是否正確。');
        return;
      }

      this.resetUserId.set(users[0].id);
      this.forgotStep.set('verify');
      this.showAlert('驗證碼已送出', 'success', '已假裝發送手機驗證碼，下一步輸入任何內容都會通過。');
    });
  }

  verifyResetCode() {
    this.forgotStep.set('reset');
    this.showAlert('驗證成功', 'success', '展示流程已通過驗證。');
  }

  resetPassword() {
    const userId = this.resetUserId();
    const { password, confirmPassword } = this.forgotForm.getRawValue();

    if (!userId) return;

    if (!password.trim()) {
      this.showAlert('錯誤', 'error', '請輸入新密碼。');
      return;
    }

    if (password !== confirmPassword) {
      this.showAlert('錯誤', 'error', '兩次輸入的新密碼不一致。');
      return;
    }

    this.auth.resetPassword(userId, password).subscribe({
      next: () => {
        this.showAlert('密碼已更新', 'success', '請使用新密碼登入。');
        this.loginForm.patchValue({
          account: this.forgotForm.controls.contact.value.trim(),
          password: '',
          otp: '',
        });
        this.forgotForm.reset();
        this.switchMode('login');
      },
      error: () => {
        this.showAlert('錯誤', 'error', '重設密碼失敗，請稍後再試。');
      },
    });
  }

  onForgotSubmit() {
    if (this.forgotStep() === 'request') {
      this.sendResetCode();
      return;
    }

    if (this.forgotStep() === 'verify') {
      this.verifyResetCode();
      return;
    }

    this.resetPassword();
  }
}
