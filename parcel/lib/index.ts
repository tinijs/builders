import {TiniConfig, Builder} from 'tinijs';
import {getIndexHtmlPath} from '@tinijs/cli';

export interface BuildOptions {
  buildCommand?: string;
  devCommand?: string;
  onDevServerStart?: () => void;
}

export default function (options: BuildOptions = {}) {
  return function (tiniConfig: TiniConfig) {
    return new ParcelBuilder(options, tiniConfig);
  };
}

export class ParcelBuilder implements Builder {
  constructor(
    private options: BuildOptions,
    private tiniConfig: TiniConfig
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
    const {outDir} = this.tiniConfig;
    const indexHtmlPath = getIndexHtmlPath(this.tiniConfig);
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
