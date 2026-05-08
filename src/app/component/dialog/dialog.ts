import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogTitle, MatDialogActions, MatDialogModule } from "@angular/material/dialog";

@Component({
  selector: 'dialog',
  templateUrl: 'dialog.html',
  imports: [MatDialogTitle, MatDialogContent, MatButtonModule, MatDialogActions,MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog {
  data = inject(MAT_DIALOG_DATA);
}
