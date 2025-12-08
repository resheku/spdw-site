#!/usr/bin/env node
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const postgres = require('postgres');

const docker = new Docker();

function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

async function pullImageIfMissing(image) {
  try { await docker.getImage(image).inspect(); return; } catch(err) {}
  console.log(`Pulling docker image ${image}...`);
  await new Promise((res, rej) => {
    docker.pull(image, (err, stream) => {
      if (err) return rej(err);
      docker.modem.followProgress(stream, (err) => err ? rej(err) : res());
    });
  });
}

async function removeIfExists(name){
  try {
    const c = docker.getContainer(name);
    await c.inspect();
    console.log(`Removing existing container ${name}`);
    try { await c.stop(); } catch(e) {}
    await c.remove({ force: true });
  } catch(e) { /* not found */ }
}

async function waitReadyViaClient(port, password, timeout = 60) {
  const connStr = `postgres://postgres:${password}@127.0.0.1:${port}/postgres`;
  const start = Date.now();
  while ((Date.now() - start) / 1000 < timeout) {
    try {
      const client = postgres(connStr, { connect_timeout: 1 });
      await client`select 1`;
      await client.end?.();
      return true;
    } catch (err) {
      await sleep(1000);
    }
  }
  throw new Error('Postgres did not become ready');
}

async function execWithInput(container, cmd, input) {
  const exec = await container.exec({ Cmd: cmd, AttachStdin: true, AttachStdout: true, AttachStderr: true });
  const stream = await exec.start({ hijack: true, stdin: true });

  return await new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    // demux output — node-dockerode expects writable streams, adapt to collect buffers
    const outWritable = { write: (chunk) => stdout.push(Buffer.from(chunk)) };
    const errWritable = { write: (chunk) => stderr.push(Buffer.from(chunk)) };
    docker.modem.demuxStream(stream, outWritable, errWritable);

    if (input) stream.write(input);
    stream.end();

    const check = async () => {
      try {
        const data = await exec.inspect();
        if (data.Running === false && data.ExitCode !== null) {
          resolve({ exitCode: data.ExitCode, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') });
        } else {
          setTimeout(check, 200);
        }
      } catch (err) { reject(err); }
    };
    check();
  });
}

async function main(){
  const image = process.env.POSTGRES_IMAGE || 'postgres:17-alpine';
  const name = process.env.CONTAINER_NAME || 'postgres-local';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';
  const hostPort = process.env.PORT || '5432';

  await pullImageIfMissing(image);
  await removeIfExists(name);

  console.log(`Creating container ${name} (host port ${hostPort})`);
  let container = null;
  container = await docker.createContainer({
    Image: image,
    name,
    Env: [`POSTGRES_PASSWORD=${password}`, 'POSTGRES_HOST_AUTH_METHOD=trust'],
    HostConfig: { PortBindings: { '5432/tcp': [{ HostPort: String(hostPort) }] } }
  });

  await container.start();

  console.log('Waiting for Postgres to be ready...');
  await waitReadyViaClient(hostPort, password, 60);
  console.log('Postgres is ready');

  const schemaFile = path.join(process.cwd(), 'sel_schema_dump.sql');
  if (fs.existsSync(schemaFile)) {
    console.log('Restoring sel_schema_dump.sql into Postgres container...');
    const dump = fs.readFileSync(schemaFile, 'utf8');
    const { exitCode, stdout, stderr } = await execWithInput(container, ['psql','-U','postgres','-d','postgres','-f','-'], dump);
    if (exitCode !== 0) {
      console.error('Restore failed');
      console.error(stderr || stdout);
      process.exit(1);
    }
    console.log('Restore complete');
  } else {
    console.log('sel_schema_dump.sql not found — created empty postgres container');
  }

  const DATABASE_URL = `postgres://postgres:${password}@127.0.0.1:${hostPort}/postgres`;
  console.log('\nStarting Next dev with DATABASE_URL:', DATABASE_URL);
  const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', env: { ...process.env, DATABASE_URL } });

  // Cleanup container unless KEEP_CONTAINER=1 is set
  async function cleanupContainer() {
    if (!container) return;
    if (process.env.KEEP_CONTAINER === '1') {
      console.log('KEEP_CONTAINER=1 — leaving container running');
      return;
    }
    try {
      console.log(`Stopping container ${name}...`);
      await container.stop();
    } catch (e) {
      // ignore
    }
    try {
      console.log(`Removing container ${name}...`);
      await container.remove({ force: true });
    } catch (e) {
      // ignore
    }
  }

  child.on('exit', async (code, signal) => {
    try { await cleanupContainer(); } catch (e) {}
    process.exit(code ?? (signal ? 1 : 0));
  });

  const forwardSignal = async (sig) => {
    if (child && !child.killed) {
      try { child.kill(sig); } catch (e) {}
    }
  };

  process.on('SIGINT', async () => { await forwardSignal('SIGINT'); });
  process.on('SIGTERM', async () => { await forwardSignal('SIGTERM'); });
  process.on('SIGHUP', async () => { await forwardSignal('SIGHUP'); });

  process.on('uncaughtException', async (err) => { console.error(err); await cleanupContainer(); process.exit(1); });
  process.on('unhandledRejection', async (reason) => { console.error(reason); await cleanupContainer(); process.exit(1); });
}

main().catch(err => { console.error(err); process.exit(1); });
