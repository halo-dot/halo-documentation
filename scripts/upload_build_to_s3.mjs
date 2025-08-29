#!/usr/bin/env node
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { $, chalk, spinner, which } from 'zx';

(async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectDir = path.join(__dirname, '..');
  const buildDir = path.join(projectDir, 'build');

  checkEnvVariable(['AWS_S3_BUCKET', 'AWS_REGION', 'AWS_PROFILE']);
  await checkDependencies(['git', 'openssl', 'aws']);
  await S3upload(buildDir);
})();

async function checkDependencies(programs) {
  try {
    for (let program of programs) {
      await which(program);
    }
  } catch (error) {
    exitWithError(`Error: Required command ${error.message}`);
  }
}

function checkEnvVariable(variableNames = []) {
  try {
    for (let variableName of variableNames) {
      if (process.env[variableName] === undefined || process.env[variableName] === null || process.env[variableName] === "") {
        throw new Error(`${variableName} environment variable is not set or has an empty value.`);
      }
    }
  } catch (error) {
    exitWithError(error.message);
  }
}

function exitWithError(errorMessage) {
  console.error(chalk.red(errorMessage));
  process.exit(1);
}

async function S3upload(filepath, target = '', remove = false, s3 = process.env.AWS_S3_BUCKET, region = process.env.AWS_REGION, profile = process.env.AWS_PROFILE) {
  try {
    console.info(`aws s3 cp ${filepath} "s3://${s3}/${target}" --recursive --region "${region}" --profile "${profile}"`);
    await spinner('Uploading to S3...', () => $`aws s3 cp ${filepath} "s3://${s3}/${target}" --recursive --region "${region}" --profile "${profile}"`);
    if (remove) await $(`rm -f ${filepath}`);
  } catch (error) {
    exitWithError(`Error: ${error.message}`);
  }
}