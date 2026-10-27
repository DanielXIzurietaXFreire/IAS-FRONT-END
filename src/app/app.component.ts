import { Component, OnDestroy, OnInit } from '@angular/core';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Front';
  private audioInitialized = false;
  private readonly initializeAudio = (): void => {
    if (this.audioInitialized) return;
    this.audioInitialized = true;
    this.audioService.init();
    document.removeEventListener('click', this.initializeAudio);
  };

  constructor(private readonly audioService: AudioService) {}

  ngOnInit(): void {
    document.addEventListener('click', this.initializeAudio);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.initializeAudio);
  }
}
