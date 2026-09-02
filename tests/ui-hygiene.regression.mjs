import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// 1. A versao do app nao pode voltar a ser um literal escrito a mao.
//
// Ela ficou em '1.0.48' enquanto o package.json chegava a 1.0.81, e isso nao era
// cosmetico: `isBroadcastCompatibleWithVersion` filtra comunicados por
// min_app_version e max_app_version usando esse valor. Um comunicado mirado nas
// versoes atuais simplesmente nao chegava a ninguem, sem erro nenhum.
{
    const source = read('components/AuthenticatedApp.tsx');
    assert.doesNotMatch(
        source,
        /const APP_VERSION = '\d+\.\d+\.\d+'/,
        'APP_VERSION deve vir de __APP_VERSION__ (vite.config.ts), nao de um literal',
    );
    assert.match(source, /__APP_VERSION__/, 'AuthenticatedApp deve usar __APP_VERSION__');
}

console.log('ui-hygiene: ok');
