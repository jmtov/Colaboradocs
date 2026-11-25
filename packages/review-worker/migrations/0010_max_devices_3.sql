-- Nuevo máximo por defecto: 3 dispositivos. Quien tenía 2 pasa a 3: no se distingue el antiguo
-- valor por defecto de un 2 puesto a propósito, así que ese también sube (se baja con `set-devices`).
-- Los demás valores se respetan. La columna sigue con DEFAULT 2: todo INSERT del código fija `max_devices`.
UPDATE reviewers SET max_devices = 3 WHERE max_devices = 2;
