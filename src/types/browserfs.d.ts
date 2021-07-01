import * as fs from 'fs';
import * as path from 'path';

declare module 'browserfs' {
    export function configure(o: { fs: string, options: any }, onError: (e?: Error) => void): void;
    export function install(obj: any): void;
    export function BFSRequire(module: 'fs'): typeof fs;
    export function BFSRequire(module: 'path'): typeof path;
}