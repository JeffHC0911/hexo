import { isAbsolute, resolve, join, extname } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'hexo-fs';
import yml from 'js-yaml';
import { deepMerge } from 'hexo-util';
import type Hexo from './index';

export = (ctx: Hexo) => function multiConfigPath(base: string, configPaths?: string, outputDir?: string): string {
  const { log } = ctx;
  const defaultPath = join(base, '_config.yml');

  if (!configPaths) {
    log.w('No config file entered.');
    return defaultPath;
  }

  const paths = parseConfigPaths(configPaths, base);

  if (paths.length === 1) {
    return handleSingleConfigPath(paths[0], defaultPath, log);
  }

  return handleMultipleConfigPaths(paths, base, outputDir, log);
};

function parseConfigPaths(configPaths: string, base: string): string[] {
  if (configPaths.includes(',')) {
    return configPaths.split(',').map(path => path.trim());
  }
  return [isAbsolute(configPaths) ? configPaths : resolve(base, configPaths)];
}

function handleSingleConfigPath(path: string, defaultPath: string, log: any): string {
  if (!existsSync(path)) {
    log.w(`Config file ${path} not found, using default.`);
    return defaultPath;
  }
  return path;
}

function handleMultipleConfigPaths(paths: string[], base: string, outputDir: string | undefined, log: any): string {
  const combinedConfig = combineConfigs(paths, base, log);
  if (!combinedConfig.count) {
    log.e('No config files found. Using _config.yml.');
    return join(base, '_config.yml');
  }

  log.i('Config based on', combinedConfig.count.toString(), 'files');
  const outputPath = join(outputDir || base, '_multiconfig.yml');
  log.d(`Writing _multiconfig.yml to ${outputPath}`);
  writeFileSync(outputPath, yml.dump(combinedConfig.config));
  return outputPath;
}

function combineConfigs(paths: string[], base: string, log: any): { config: any; count: number } {
  let combinedConfig = {};
  let count = 0;

  paths.forEach(path => {
    const configPath = isAbsolute(path) ? path : join(base, path);
    if (!existsSync(configPath)) {
      log.w(`Config file ${path} not found.`);
      return;
    }

    const file = readFileSync(configPath);
    const ext = extname(path).toLowerCase();

    if (ext === '.yml' || ext === '.yaml') {
      combinedConfig = deepMerge(combinedConfig, yml.load(file));
      count++;
    } else if (ext === '.json') {
      combinedConfig = deepMerge(combinedConfig, JSON.parse(file.toString()));
      count++;
    } else {
      log.w(`Config file ${path} not supported type.`);
    }
  });

  return { config: combinedConfig, count };
}
