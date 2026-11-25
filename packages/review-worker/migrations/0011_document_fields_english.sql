-- Los campos del documento pasan a inglés: tipo -> type (acta, iniciativa, guia, otro -> minutes,
-- initiative, guide, other), responsable -> owner y participantes -> attendees. Se reescribe el JSON
-- guardado en los documentos, sus versiones y sus borradores. Quien aún mande los nombres viejos
-- (un JSON importado, un agente) se lee igual: ver `migrateLegacyKeys` en review-core.

UPDATE documents SET content = json_set(json_remove(content, '$.tipo'), '$.type',
  CASE json_extract(content, '$.tipo')
    WHEN 'acta' THEN 'minutes' WHEN 'iniciativa' THEN 'initiative' WHEN 'guia' THEN 'guide' ELSE 'other'
  END)
  WHERE json_extract(content, '$.tipo') IS NOT NULL;
UPDATE documents SET content = json_set(json_remove(content, '$.responsable'), '$.owner', json_extract(content, '$.responsable'))
  WHERE json_extract(content, '$.responsable') IS NOT NULL;
UPDATE documents SET content = json_set(json_remove(content, '$.participantes'), '$.attendees', json_extract(content, '$.participantes'))
  WHERE json_extract(content, '$.participantes') IS NOT NULL;

UPDATE document_versions SET content = json_set(json_remove(content, '$.tipo'), '$.type',
  CASE json_extract(content, '$.tipo')
    WHEN 'acta' THEN 'minutes' WHEN 'iniciativa' THEN 'initiative' WHEN 'guia' THEN 'guide' ELSE 'other'
  END)
  WHERE json_extract(content, '$.tipo') IS NOT NULL;
UPDATE document_versions SET content = json_set(json_remove(content, '$.responsable'), '$.owner', json_extract(content, '$.responsable'))
  WHERE json_extract(content, '$.responsable') IS NOT NULL;
UPDATE document_versions SET content = json_set(json_remove(content, '$.participantes'), '$.attendees', json_extract(content, '$.participantes'))
  WHERE json_extract(content, '$.participantes') IS NOT NULL;

UPDATE document_drafts SET content = json_set(json_remove(content, '$.tipo'), '$.type',
  CASE json_extract(content, '$.tipo')
    WHEN 'acta' THEN 'minutes' WHEN 'iniciativa' THEN 'initiative' WHEN 'guia' THEN 'guide' ELSE 'other'
  END)
  WHERE json_extract(content, '$.tipo') IS NOT NULL;
UPDATE document_drafts SET content = json_set(json_remove(content, '$.responsable'), '$.owner', json_extract(content, '$.responsable'))
  WHERE json_extract(content, '$.responsable') IS NOT NULL;
UPDATE document_drafts SET content = json_set(json_remove(content, '$.participantes'), '$.attendees', json_extract(content, '$.participantes'))
  WHERE json_extract(content, '$.participantes') IS NOT NULL;
