import {resolve, parse} from 'pathe';
import {readFile} from 'node:fs/promises';
import {outputFile, copy} from 'fs-extra/esm';
import {loadFile, writeFile} from 'magicast';
import {load} from 'cheerio';
import {TiniApp, Prebuilder, PrebuildFileHookContext} from '@tinijs/core';
import {listDir, cleanDir} from '@tinijs/cli';

export interface PrebuildOptions {
  skipMinifyHtmlLiterals?: boolean;
  precompileGeneric?: 'none' | 'lite' | 'full';
}

export default function (options: PrebuildOptions = {}) {
  return function (tiniApp: TiniApp) {
    return new DefaultPrebuilder(options, tiniApp);
  };
}

export class DefaultPrebuilder implements Prebuilder {
  constructor(
    private options: PrebuildOptions,
    private tiniApp: TiniApp
  ) {}

  async build() {
    const srcPath = resolve(this.tiniApp.config.srcDir);
    await cleanDir(this.tiniApp.config.tempDir);
    const paths = await listDir(srcPath);
    await this.tiniApp.hooks.callHook('prebuild:before');
    for (let i = 0; i < paths.length; i++) {
      await this.buildFile(paths[i]);
    }
    await this.tiniApp.hooks.callHook('prebuild:after');
  }

  async buildFile(inPath: string) {
    const {dir, base, ext} = parse(inPath);
    const outPath = resolve(
      this.tiniApp.config.tempDir,
      inPath.split(`/${this.tiniApp.config.srcDir}/`).pop() as string
    );
    const context: PrebuildFileHookContext | null =
      ext === '.html'
        ? {
            base,
            inPath,
            outPath:
              base !== 'app.html'
                ? outPath
                : outPath.replace('/app.html', '/index.html'),
            html: load(await readFile(inPath, 'utf8')),
          }
        : ext === '.ts' || ext === '.mts' || ext === '.js' || ext === '.mjs'
        ? {
            base,
            inPath,
            outPath,
            jts: await loadFile(inPath),
          }
        : !this.isUnderTopDir(inPath, 'public')
        ? {base, inPath, outPath}
        : null;

    if (context) {
      // build file
      await this.tiniApp.hooks.callHook('prebuild:beforeFile', context);
      await this.builtinFileBuilder(context);
      await this.tiniApp.hooks.callHook('prebuild:afterFile', context);

      // save file
      if (context.html) {
        outputFile(context.outPath, context.html.html());
      } else if (context.jts) {
        writeFile(context.jts, context.outPath);
      } else {
        copy(context.inPath, context.outPath);
      }
    }
  }

  private async builtinFileBuilder(context: PrebuildFileHookContext) {
    // eslint-disable-next-line no-empty
    if (context.jts) {
    }
  }

  private isUnderTopDir(path: string, topDir: string) {
    return ~path.indexOf(
      `/${this.tiniApp.config.srcDir}/${
        (this.tiniApp.config.dirs as Record<string, string>)?.[topDir] || topDir
      }/`
    );
  }
}
