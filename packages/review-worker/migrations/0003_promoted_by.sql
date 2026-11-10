-- Quién hizo admin a cada persona (null: la creó el CLI, o nunca fue admin).
-- Define la cadena de personas que un admin no puede tocar desde la pantalla de accesos.
ALTER TABLE reviewers ADD COLUMN promoted_by TEXT REFERENCES reviewers(id);
