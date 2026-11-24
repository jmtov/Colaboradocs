-- Rol «agente»: una persona que es un asistente automático. No es admin: solo puede leer,
-- crear y asignar tareas y guardar borradores (nunca publicar, archivar ni gestionar accesos).
ALTER TABLE reviewers ADD COLUMN is_agent INTEGER NOT NULL DEFAULT 0;
