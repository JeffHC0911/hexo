import pathFn from 'path';
import osFn from 'os';
import { writeFileSync, rmdirSync, unlinkSync, readFileSync } from 'hexo-fs';
import yml from 'js-yaml';
import Hexo from '../../../lib/hexo';
import multiConfigPath from '../../../lib/hexo/multi_config_path';

class ConsoleReader {
  reader: { type: string, msg: string }[];
  _silent: boolean;
  _debug: boolean;
  level: string;
  d: (...args: any[]) => void;
  i: (...args: any[]) => void;
  w: (...args: any[]) => void;
  e: (...args: any[]) => void;

  constructor() {
    this.reader = [];
    this._silent = false;
    this._debug = false;
    this.level = 'info';
    const logTypes = ['debug', 'info', 'warning', 'error'];

    logTypes.forEach(type => {
      this[type.charAt(0)] = (...args) => {
        this.reader.push({
          type,
          msg: args.join(' ')
        });
      };
    });
  }
}

const hexo: { log: ConsoleReader, base_dir: string } = new Hexo(pathFn.join(__dirname, 'test_dir')) as any;
const mcp = multiConfigPath(hexo);
const base = hexo.base_dir;
hexo.log = new ConsoleReader();

const testData = [
  { path: base + 'test1.yml', content: 'author: foo\ntype: dinosaur\nfavorites:\n  food: sushi\n  color: purple' },
  { path: base + 'test2.yml', content: 'author: bar\nfavorites:\n  food: candy\n  ice_cream: chocolate' },
  { path: base + 'test1.json', content: '{"author": "dinosaur","type": "elephant","favorites": {"food": "burgers"}}' },
  { path: base + 'test2.json', content: '{"author": "waldo","favorites": {"food": "ice cream","ice_cream": "strawberry"}}' },
  { path: base + 'test1.xml', content: '' }, // not supported type
  { path: '/tmp/test3.json', content: '{"author": "james bond","favorites": {"food": "martini","ice_cream": "vanilla"}}' }
];

describe('config flag handling', () => {

  before(() => {
    testData.forEach(data => writeFileSync(data.path, data.content));
  });

  after(() => {
    testData.forEach(data => unlinkSync(data.path));
    rmdirSync(hexo.base_dir);
  });

  it('no file', () => {
    mcp(base).should.equal(base + '_config.yml');
    hexo.log.reader[0].type.should.eql('warning');
    hexo.log.reader[0].msg.should.eql('No config file entered.');
  });

  it('not supported type', () => {
    mcp(base, 'test1.xml,test1.json').should.equal(base + '_multiconfig.yml');
    hexo.log.reader[0].type.should.eql('warning');
    hexo.log.reader[0].msg.should.eql('Config file test1.xml not supported type.');
  });

  it('1 file', () => {
    const paths = ['test1.yml', 'test1.json', '/tmp/test3.json'];
    paths.forEach(path => {
      const result = mcp(base, path);
      result.should.eql(pathFn.resolve(base, path));
    });
  });

  it('1 not found file warning', () => {
    const notFile = 'not_a_file.json';
    mcp(base, notFile).should.eql(pathFn.join(base, '_config.yml'));
    hexo.log.reader[0].type.should.eql('warning');
    hexo.log.reader[0].msg.should.eql(`Config file ${notFile} not found, using default.`);
  });

  it('combined config output', () => {
    const combinedPath = pathFn.join(base, '_multiconfig.yml');
    const tests = ['test1.yml,test2.yml', 'test1.yml,test1.json', 'test1.json,test2.json', 'notafile.yml,test1.json'];
    tests.forEach(test => {
      mcp(base, test).should.eql(combinedPath);
    });
    hexo.log.reader[0].type.should.eql('info');
    hexo.log.reader[0].msg.should.eql('Config based on multiple files');
  });

  it('overwrite tests', () => {
    const combinations = [
      { files: 'test1.yml,test2.yml', expected: { author: 'bar', type: 'dinosaur' } },
      { files: 'test1.json,test2.json', expected: { author: 'waldo', type: 'elephant' } }
    ];
    combinations.forEach(({ files, expected }) => {
      let config = readFileSync(mcp(base, files), { encoding: 'utf8' });
      config = yml.load(config.toString()) as any;
      (config as any).author.should.eql(expected.author);
      (config as any).type.should.eql(expected.type);
    });
  });
});
