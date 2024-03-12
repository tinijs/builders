import {resolve, parse} from 'pathe';
import {readFile} from 'node:fs/promises';
import {ensureDir, outputFile, copy} from 'fs-extra/esm';
import {TiniConfig, Prebuilder} from 'tinijs';
import {listDir, cleanDir} from '@tinijs/cli';

export interface PrebuildOptions {
  skipMinifyHtmlLiterals?: boolean;
  precompileGeneric?: 'none' | 'lite' | 'full';
}

export default function (options: PrebuildOptions = {}) {
  return function (tiniConfig: TiniConfig) {
    return new DefaultPrebuilder(options, tiniConfig);
  };
}

export class DefaultPrebuilder implements Prebuilder {
  constructor(
    private options: PrebuildOptions,
    private tiniConfig: TiniConfig
  ) {}

  async build() {
    const srcPath = resolve(this.tiniConfig.srcDir);
    await cleanDir(this.tiniConfig.tempDir);
    const paths = await listDir(srcPath);
    for (let i = 0; i < paths.length; i++) {
      await this.buildFile(paths[i]);
    }
  }

  async buildFile(path: string) {
    const {dir, base, ext} = parse(path);
    const innerFilePath = path
      .split(`/${this.tiniConfig.srcDir}/`)
      .pop() as string;
    const outFilePath = resolve(this.tiniConfig.tempDir, innerFilePath);

    // create dir
    await ensureDir(dir);

    /*
     * app.html -> index.html
     */
    if (base === 'app.html') {
      await outputFile(
        outFilePath.replace('/app.html', '/index.html'),
        await readFile(path, 'utf8')
      );
    } else if (ext === '.ts') {
      /*
       * copy but skip public dir
       */
      const code = await readFile(path, 'utf8');
      // TODO: prebuild code
      await outputFile(outFilePath, code);
    } else if (!this.isUnder(path, 'public')) {
      /*
       * copy but skip public dir
       */
      await copy(path, outFilePath);
    }
  }

  private isUnder(path: string, topDir: string) {
    return ~path.indexOf(
      `/${this.tiniConfig.srcDir}/${
        (this.tiniConfig.dirs as any)?.[topDir] || topDir
      }/`
    );
  }
}
