import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  DEFAULT_MAX_DEVICES,
  formatPin,
  generatePin,
  hashPin,
} from '@juntanza/review-core';
import { quote, runSql, selectRows } from './d1.utils';

const PRIVATE_FILE = 'pins.private.txt';
const MAIL_FILE = 'pins.private.csv';

function readSecret(remote: boolean): string {
  const fromEnv = process.env.TOKEN_SECRET;
  if (fromEnv) return fromEnv;
  // Producción tiene su propio secreto (.prod.vars); local usa .dev.vars.
  const file = remote ? '.prod.vars' : '.dev.vars';
  if (existsSync(file)) {
    const line = readFileSync(file, 'utf8')
      .split('\n')
      .find((entry) => entry.startsWith('TOKEN_SECRET='));
    if (line) return line.slice('TOKEN_SECRET='.length).trim();
  }
  throw new Error(`Falta TOKEN_SECRET (variable de entorno o ${file}).`);
}

/** CSV simple con comillas dobles; suficiente para nombre, municipio y correo. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function importPeople(
  file: string,
  options: ReturnType<typeof parseArgs>,
  secret: string,
) {
  const [header = [], ...records] = parseCsv(readFileSync(file, 'utf8'));
  const column = (name: string) =>
    header.map((h) => h.trim().toLowerCase()).indexOf(name);
  const nameIndex = column('name');
  const municipalityIndex = column('municipality');
  const emailIndex = column('email');
  if (nameIndex < 0 || municipalityIndex < 0) {
    throw new Error('El CSV necesita las columnas name y municipality.');
  }

  const existing = new Set(
    selectRows(runSql('SELECT name FROM reviewers', options.remote)).map(
      (row) => String(row.name),
    ),
  );
  const mail: string[][] = [['name', 'email', 'municipality', 'pin']];
  const statements: string[] = [];
  const created: string[] = [];
  const updated: string[] = [];
  for (const record of records) {
    const name = (record[nameIndex] ?? '').trim();
    const municipality = (record[municipalityIndex] ?? '').trim();
    const email = emailIndex >= 0 ? (record[emailIndex] ?? '').trim() : '';
    if (!name) continue;
    const municipalitySql = municipality ? quote(municipality) : 'NULL';
    if (existing.has(name)) {
      statements.push(
        `UPDATE reviewers SET municipality = ${municipalitySql} WHERE name = ${quote(name)}`,
      );
      updated.push(name);
      continue;
    }
    const pin = generatePin();
    const hash = await hashPin(pin, secret);
    statements.push(
      `INSERT INTO reviewers (id, name, pin_hash, is_admin, max_devices, municipality, created_at)
       VALUES (${quote(crypto.randomUUID())}, ${quote(name)}, ${quote(hash)}, 0, ${options.maxDevices},
               ${municipalitySql}, ${quote(new Date().toISOString())})`,
    );
    existing.add(name);
    created.push(name);
    mail.push([name, email, municipality, formatPin(pin)]);
  }
  if (statements.length === 0) {
    console.log('Nada que importar.');
    return;
  }
  runSql(statements.join(';\n'), options.remote);
  writeFileSync(
    MAIL_FILE,
    `${mail.map((row) => row.map(csvCell).join(',')).join('\n')}\n`,
  );
  console.log(
    `Creados: ${created.length}. Municipio actualizado en: ${updated.length}.`,
  );
  console.log(
    `PINs para el envío por correo en ${MAIL_FILE} (no se commitea).`,
  );
}

function parseArgs(argv: string[]) {
  const flags = argv.filter((arg) => arg.startsWith('--'));
  const names = argv.filter((arg) => !arg.startsWith('--'));
  const municipalityFlag = flags.find((flag) =>
    flag.startsWith('--municipality='),
  );
  const maxDevicesFlag = flags.find((flag) =>
    flag.startsWith('--max-devices='),
  );
  return {
    names,
    remote: flags.includes('--remote'),
    isAdmin: flags.includes('--admin'),
    municipality: municipalityFlag
      ? municipalityFlag.slice('--municipality='.length)
      : null,
    maxDevices: maxDevicesFlag
      ? Number(maxDevicesFlag.split('=')[1])
      : DEFAULT_MAX_DEVICES,
  };
}

async function addReviewer(
  name: string,
  options: ReturnType<typeof parseArgs>,
  secret: string,
) {
  const pin = generatePin();
  const hash = await hashPin(pin, secret);
  runSql(
    `INSERT INTO reviewers (id, name, pin_hash, is_admin, max_devices, municipality, created_at)
     VALUES (${quote(crypto.randomUUID())}, ${quote(name)}, ${quote(hash)},
             ${options.isAdmin ? 1 : 0}, ${options.maxDevices},
             ${options.municipality ? quote(options.municipality) : 'NULL'}, ${quote(new Date().toISOString())})`,
    options.remote,
  );
  return pin;
}

async function reissuePin(
  name: string,
  options: ReturnType<typeof parseArgs>,
  secret: string,
) {
  const pin = generatePin();
  const hash = await hashPin(pin, secret);
  runSql(
    `UPDATE reviewers SET pin_hash = ${quote(hash)}, revoked_at = NULL WHERE name = ${quote(name)};
     DELETE FROM devices WHERE reviewer_id = (SELECT id FROM reviewers WHERE name = ${quote(name)})`,
    options.remote,
  );
  return pin;
}

function savePin(name: string, pin: string) {
  const line = `${new Date().toISOString()}\t${name}\t${formatPin(pin)}\n`;
  appendFileSync(PRIVATE_FILE, line);
  console.log(`${name}: ${formatPin(pin)}`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);

  switch (command) {
    case 'add': {
      const secret = readSecret(options.remote);
      for (const name of options.names) {
        savePin(name, await addReviewer(name, options, secret));
      }
      console.log(
        `\nPINs guardados también en ${PRIVATE_FILE} (no se commitea).`,
      );
      return;
    }
    case 'import': {
      const [file] = options.names;
      if (!file) throw new Error('Falta el archivo CSV.');
      await importPeople(file, options, readSecret(options.remote));
      return;
    }
    case 'reissue': {
      const secret = readSecret(options.remote);
      for (const name of options.names) {
        savePin(name, await reissuePin(name, options, secret));
      }
      return;
    }
    case 'reset-devices':
      for (const name of options.names) {
        runSql(
          `DELETE FROM devices WHERE reviewer_id = (SELECT id FROM reviewers WHERE name = ${quote(name)})`,
          options.remote,
        );
      }
      console.log('Dispositivos reseteados.');
      return;
    case 'set-devices':
      for (const name of options.names) {
        runSql(
          `UPDATE reviewers SET max_devices = ${options.maxDevices} WHERE name = ${quote(name)}`,
          options.remote,
        );
      }
      console.log(`Máximo de dispositivos: ${options.maxDevices}.`);
      return;
    case 'revoke':
      for (const name of options.names) {
        runSql(
          `UPDATE reviewers SET revoked_at = ${quote(new Date().toISOString())} WHERE name = ${quote(name)}`,
          options.remote,
        );
      }
      console.log('PIN revocado.');
      return;
    case 'list':
      console.log(
        JSON.stringify(
          runSql(
            `SELECT name, is_admin, max_devices, revoked_at,
                    (SELECT COUNT(*) FROM devices d WHERE d.reviewer_id = r.id) AS devices
             FROM reviewers r ORDER BY name`,
            options.remote,
          ),
          null,
          2,
        ),
      );
      return;
    default:
      console.error(
        'Uso: add | reissue | reset-devices | revoke | list (ver el encabezado del script).',
      );
      process.exitCode = 1;
  }
}

await main();
