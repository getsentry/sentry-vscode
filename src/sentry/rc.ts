import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import promisify = require('util.promisify');

const readFile = promisify(fs.readFile);

let token: string | false | undefined;

async function loadToken(): Promise<string | false> {
  // TODO: Make this more robust
  // TODO: Add a way to ask for the token
  // TODO: Add a way to set/refresh the token

  const home = os.homedir();
  const rcpath = path.join(home, '.sentryclirc');

  try {
    const rc = await readFile(rcpath, 'utf8');
    const match = rc.match(/^token\s*=\s*(\w+)$/m);
    if (!match) {
      return false;
    }

    return match[1].toLowerCase();
  } catch (e) {
    return false;
  }
}

export async function getToken(): Promise<string | false> {
  if (token === undefined) {
    token = await loadToken();
  }

  return token;
}
