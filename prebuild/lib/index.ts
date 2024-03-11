import {Prebuilder as PrebuilderInterface} from '@tinijs/cli';
import {TiniConfig} from 'tinijs';

export default function (tiniConfig: TiniConfig) {
  return new Prebuilder(tiniConfig);
}

export class Prebuilder implements PrebuilderInterface {
  constructor(private tiniConfig: TiniConfig) {}

  async buildAll() {
    console.log('Building all files');
  }

  async buildFile(path: string) {
    console.log('Building file', path);
  }

  async removeFile(path: string) {
    console.log('Removing file', path);
  }
}
