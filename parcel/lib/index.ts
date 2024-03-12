import {TiniApp, Builder} from '@tinijs/core';
import {getIndexHtmlPath} from '@tinijs/cli';

export interface BuildOptions {
  buildCommand?: string;
  devCommand?: string;
  onDevServerStart?: () => void;
}

export default function (options: BuildOptions = {}) {
  return function (tiniApp: TiniApp) {
    return new ParcelBuilder(options, tiniApp);
  };
}

export class ParcelBuilder implements Builder {
  constructor(
    private options: BuildOptions,
    private tiniApp: TiniApp
  ) {}

  get build() {
    return {
      command: this.options.buildCommand || this.commands.buildCommand,
    };
  }

  get dev() {
    return {
      command: this.options.devCommand || this.commands.devCommand,
      onServerStart: this.options.onDevServerStart,
    };
  }

  private get commands() {
    const {outDir} = this.tiniApp.config;
    const indexHtmlPath = getIndexHtmlPath(this.tiniApp.config);
    return {
      buildCommand:
        this.options.buildCommand ||
        `parcel build "${indexHtmlPath}" --dist-dir ${outDir} --no-cache`,
      devCommand:
        this.options.devCommand ||
        `parcel "${indexHtmlPath}" --dist-dir ${outDir} --port 3000 --no-cache --log-level none`,
    };
  }
}
