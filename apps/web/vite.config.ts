import react from '@vitejs/plugin-react';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.resolve(dirname, 'data/todos.json');

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function hasValidShape(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const maybeData = value as { version?: unknown; days?: unknown };
  return maybeData.version === 2 && !!maybeData.days && typeof maybeData.days === 'object';
}

function todoJsonApi(): Plugin {
  return {
    name: 'todo-json-api',
    configureServer(server) {
      server.middlewares.use('/api/todos', async (request, response) => {
        try {
          if (request.method === 'GET') {
            const file = await readFile(dataFile, 'utf8');
            sendJson(response, 200, JSON.parse(file));
            return;
          }

          if (request.method === 'PUT') {
            const body = await readBody(request);
            const nextData: unknown = JSON.parse(body);

            if (!hasValidShape(nextData)) {
              sendJson(response, 400, { error: 'Invalid todo calendar data shape.' });
              return;
            }

            await mkdir(path.dirname(dataFile), { recursive: true });
            await writeFile(dataFile, `${JSON.stringify(nextData, null, 2)}\n`, 'utf8');
            sendJson(response, 200, { ok: true });
            return;
          }

          sendJson(response, 405, { error: 'Method not allowed.' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unexpected API error.';
          sendJson(response, 500, { error: message });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), todoJsonApi()],
});
