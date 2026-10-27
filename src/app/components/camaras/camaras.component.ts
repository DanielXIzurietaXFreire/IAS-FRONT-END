import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CamaraService } from '../../services/camara.service';
import { Camara, CamaraInput } from '../../models/camara.model';

// Antes había un CameraRow con un campo `status` que siempre valía 'Activa': la columna
// «Estado» de la tabla mostraba un dato inventado. El sistema no guarda el estado de una
// cámara, así que se quitaron los dos (08/10/2026).
type CameraRow = Camara;

@Component({ selector: 'app-camaras', standalone: false, templateUrl: './camaras.component.html', styleUrl: './camaras.component.css' })
export class CamarasComponent implements OnInit {
  cameras: CameraRow[] = [];
  loading = false;
  modal: 'form' | 'delete' | null = null;
  editingCamera: CameraRow | null = null;
  pendingDelete: CameraRow | null = null;
  form: CamaraInput = { nombre: '', ubicacion: '', ip: '', stream: '' };
  message = '';

  constructor(
    private readonly camaraService: CamaraService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void { this.loadCamaras(); }

  openAdd(): void { this.editingCamera = null; this.form = { nombre: '', ubicacion: '', ip: '', stream: '' }; this.modal = 'form'; }
  openEdit(camera: CameraRow): void { this.editingCamera = camera; this.form = { nombre: camera.nombre, ubicacion: camera.ubicacion, ip: camera.ip, stream: camera.stream }; this.modal = 'form'; }
  openDelete(camera: CameraRow): void { this.pendingDelete = camera; this.modal = 'delete'; }
  closeModal(): void { this.modal = null; this.pendingDelete = null; }

  saveCamera(): void {
    if (!this.form.nombre.trim() || !this.form.ubicacion.trim() || !this.form.ip.trim() || !this.form.stream.trim()) return;
    this.message = '';
    this.loading = true;
    if (this.editingCamera) {
      this.camaraService.updateCamara(this.editingCamera.id, this.form).subscribe({
        next: camera => { this.replaceCamera(camera); this.finishSave('Cámara actualizada correctamente.'); },
        error: error => this.handleError(error)
      });
    } else {
      this.camaraService.createCamara(this.form).subscribe({
        next: camera => { this.cameras = [...this.cameras, this.toCameraRow(camera)]; this.finishSave('Cámara creada correctamente.'); },
        error: error => this.handleError(error)
      });
    }
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.message = '';
    this.loading = true;
    const id = this.pendingDelete.id;
    this.camaraService.deleteCamara(id).subscribe({
      next: () => {
        this.cameras = this.cameras.filter(camera => camera.id !== id);
        this.loading = false;
        this.closeModal();
        this.message = 'Cámara eliminada correctamente.';
      },
      error: error => this.handleError(error)
    });
  }

  onEscape(): void { if (this.modal) this.closeModal(); }

  maskStream(stream: string): string {
    if (stream.length <= 10) return `${stream.slice(0, 3)}...${stream.slice(-3)}`;
    return `${stream.slice(0, 8)}...${stream.slice(-6)}`;
  }

  private loadCamaras(): void {
    this.loading = true;
    this.camaraService.getCamaras().subscribe({
      next: cameras => { this.cameras = cameras.map(camera => this.toCameraRow(camera)); this.loading = false; },
      error: error => this.handleError(error)
    });
  }

  private replaceCamera(camera: Camara): void {
    this.cameras = this.cameras.map(item => item.id === camera.id ? this.toCameraRow(camera) : item);
  }

  private toCameraRow(camera: Camara): CameraRow {
    return { ...camera };
  }

  private finishSave(message: string): void {
    this.loading = false;
    this.closeModal();
    this.message = message;
  }

  private handleError(error: HttpErrorResponse): void {
    this.loading = false;
    if (error.status === 401) {
      this.authService.logout();
      void this.router.navigate(['/login']);
      return;
    }
    if (error.status === 403) this.message = 'No tienes permisos para realizar esta acción.';
    else if (error.status === 404) this.message = 'La cámara solicitada no fue encontrada.';
    else if (error.status === 409) {
      // La cámara tiene alertas registradas: el historial de seguridad no se borra.
      this.message = typeof error.error === 'string' && error.error
        ? error.error
        : 'No se puede eliminar la cámara porque tiene alertas registradas.';
    }
    else this.message = 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}
