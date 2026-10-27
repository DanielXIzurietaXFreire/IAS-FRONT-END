export interface Camara {
  id: number;
  nombre: string;
  ubicacion: string;
  ip: string;
  stream: string;
}

export type CamaraInput = Omit<Camara, 'id'>;