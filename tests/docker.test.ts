import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function test_dockerfile_exists_and_has_base_image() {
  const path = join(process.cwd(), 'Dockerfile');
  if (!existsSync(path)) throw new Error('Dockerfile missing');
  const content = readFileSync(path, 'utf8');
  if (!content.includes('selenium/standalone-chrome')) throw new Error('Wrong base image');
  console.log('PASS: Dockerfile uses selenium/standalone-chrome');
}

function test_dockerignore_excludes_node_modules() {
  const path = join(process.cwd(), '.dockerignore');
  if (!existsSync(path)) throw new Error('.dockerignore missing');
  const content = readFileSync(path, 'utf8');
  if (!content.includes('node_modules')) throw new Error('node_modules not in .dockerignore');
  console.log('PASS: .dockerignore excludes node_modules');
}

test_dockerfile_exists_and_has_base_image();
test_dockerignore_excludes_node_modules();
