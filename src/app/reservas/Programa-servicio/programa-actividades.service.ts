import { Injectable } from '@angular/core';

export interface ProgramaSolicitudContext {
  solicitudId: string;
  estado: string;
  folio: string;
  escuela: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  estudiantes: number;
  adultos: number;
  gradoEdades: string;
  secciones: number;
  servicios: string[];
}

export interface ProgramaServicioData {
  datosGenerales: {
    escuela: string;
    fecha: string;
    horaInicio: string;
    horaTermino: string;
    gradoEdades: string;
    estudiantes: number | null;
    adultos: number | null;
    secciones: number | null;
    servicioEducativo: string;
    folio: string;
  };
  bloques: Array<{
    tipo: 'tabla' | 'grupo';
    titulo: string;
    filas: Array<{ horario: string; lugar: string; actividad: string; responsables: string }>;
  }>;
}

export interface ProgramaServicioRecord {
  solicitudId: string;
  estado: 'aprobada';
  programa: ProgramaServicioData;
  pdfDataUri: string;
  generadoEn: string;
}

export type SaveProgramaResult = 'guardado' | 'ya-generado' | 'no-aprobada' | 'error';

const CONTEXTS_KEY = 'jbuap-programa-servicio-contextos';
const PROGRAMS_KEY = 'jbuap-programa-servicio-generados';

@Injectable({ providedIn: 'root' })
export class ProgramaActividadesService {
  setContext(context: ProgramaSolicitudContext): void {
    try {
      const contexts = this.readContexts();
      contexts[context.solicitudId] = context;
      localStorage.setItem(CONTEXTS_KEY, JSON.stringify(contexts));
    } catch {
      // El formulario sigue disponible si el navegador bloquea el almacenamiento local.
    }
  }

  getContext(solicitudId: string): ProgramaSolicitudContext | null {
    try {
      return this.readContexts()[solicitudId] ?? null;
    } catch {
      return null;
    }
  }

  getProgram(solicitudId: string): ProgramaServicioRecord | null {
    try {
      return this.readPrograms()[solicitudId] ?? null;
    } catch {
      return null;
    }
  }

  hasProgram(solicitudId: string | number): boolean {
    return this.getProgram(String(solicitudId)) !== null;
  }

  saveProgram(
    solicitudId: string,
    estado: string,
    programa: ProgramaServicioData,
    pdfDataUri: string
  ): SaveProgramaResult {
    if (estado !== 'aprobada') return 'no-aprobada';

    try {
      const programs = this.readPrograms();
      if (programs[solicitudId]) return 'ya-generado';

      programs[solicitudId] = {
        solicitudId,
        estado: 'aprobada',
        programa,
        pdfDataUri,
        generadoEn: new Date().toISOString()
      };
      localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
      return 'guardado';
    } catch {
      return 'error';
    }
  }

  downloadSavedPdf(solicitudId: string): boolean {
    const record = this.getProgram(solicitudId);
    if (!record?.pdfDataUri) return false;

    const link = document.createElement('a');
    link.href = record.pdfDataUri;
    link.download = `Programa_Servicio_${record.programa.datosGenerales.folio || solicitudId}.pdf`;
    link.click();
    return true;
  }

  private readContexts(): Record<string, ProgramaSolicitudContext> {
    const stored = localStorage.getItem(CONTEXTS_KEY);
    return stored ? JSON.parse(stored) as Record<string, ProgramaSolicitudContext> : {};
  }

  private readPrograms(): Record<string, ProgramaServicioRecord> {
    const stored = localStorage.getItem(PROGRAMS_KEY);
    return stored ? JSON.parse(stored) as Record<string, ProgramaServicioRecord> : {};
  }
}
