import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  imports: [MatIconModule, RouterLink],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  host: {
    class: 'toolbar',
  },
})
export class Toolbar {
  private route: ActivatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    console.log(this.route.pathFromRoot);


  }
}
