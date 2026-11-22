-- Borrador de una presentación: lo que el editor guarda mientras trabaja. Puede estar incompleto
-- (no se valida al guardar); al publicar se valida y pasa a `content`.
ALTER TABLE decks ADD COLUMN draft TEXT;
ALTER TABLE decks ADD COLUMN draft_at TEXT;
