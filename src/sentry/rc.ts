import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as ini from 'ini';
import * as promisify from 'util.promisify';

const readFile = promisify(fs.readFile);

let token: string | undefined;

async function loadRcToken(): Promise<string | undefined> {
  const home = os.homedir();
  const rcpath = path.join(home, '.sentryclirc');

  try {
    const text = await readFile(rcpath, 'utf8');
    const rc = ini.parse(text);
    return rc.auth && rc.auth.token;
  } catch (e) {
    return undefined;
  }
}

async function loadPropertiesToken(): Promise<string | undefined> {
  // TODO: Implement
  return undefined;
}

async function promptToken(): Promise<string | undefined> {
  // TODO: Implement
  return undefined;
}

export async function getToken(): Promise<string | undefined> {
  if (!token) {
    token = await loadRcToken();
  }

  if (!token) {
    token = await loadPropertiesToken();
  }

  if (!token) {
    // TODO: Add a way to set/refresh the token
    token = await promptToken();
  }

  return token;
}
