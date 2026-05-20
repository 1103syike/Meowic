import { Component, EventEmitter, Output, signal } from '@angular/core';

interface ProPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-pro-dialog',
  templateUrl: './pro-dialog.html',
  styleUrl: './pro-dialog.scss',
})
export class ProDialog {
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<ProPlan>();

  public plans: ProPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'NT$ 0',
      period: '/月',
      description: '保留最基本的聽歌與收藏體驗。',
      features: ['建立基本播放清單', '收藏喜歡的歌曲', '標準音質播放'],
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 'NT$ 149',
      period: '/月',
      badge: '推薦',
      description: '適合每天聽歌、整理歌單的人。',
      features: ['無廣告沉浸播放', '更高音質串流', '進階播放清單整理'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'NT$ 299',
      period: '/月',
      description: '給想完整管理音樂庫的重度使用者。',
      features: ['完整音樂庫管理', '優先體驗新功能', '專屬主題與個人化設定'],
    },
  ];

  public selectedPlanId = signal('plus');

  public selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
  }

  public confirmPlan(): void {
    const plan = this.plans.find((item) => item.id === this.selectedPlanId());
    if (plan) {
      this.selected.emit(plan);
    }
    this.close.emit();
  }

  public closeDialog(): void {
    this.close.emit();
  }
}
