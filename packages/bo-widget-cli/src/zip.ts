import { crc32, deflateRawSync } from 'node:zlib';

/** A file to write in a zip: its path inside the archive (`/` separated) and its content. */
export interface ZipInputFile {
  readonly path: string;
  readonly data: Uint8Array;
}

const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const EOCD_SIZE = 22;
const VERSION = 20;
const METHOD_STORED = 0;
const METHOD_DEFLATE = 8;
/** 1980-01-01 00:00, the earliest MS-DOS date: a fixed date keeps the archive reproducible. */
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;
const MAX_16 = 0xffff;
const MAX_32 = 0xffffffff;

/**
 * Writes a plain zip archive: no ZIP64, no data descriptor, no encryption, each file stored or
 * deflated (whichever is smaller), with a fixed date. The same files in the same order give the
 * same bytes with a given zlib (Node.js) version. The paths are written as given, not checked:
 * run `validateWidgetArchive` on the result to know whether the back office accepts it.
 *
 * @param files - The files, in the order they are written. Folders are not written: their path
 * is part of the file paths.
 * @returns The archive.
 * @throws {RangeError} When the archive would need ZIP64: more than 65 535 files, or more than
 * 4 GB, or a path longer than 65 535 bytes.
 */
export const createZip = (files: readonly ZipInputFile[]): Buffer => {
  if (files.length > MAX_16) throw new RangeError(`Too many files for a zip: ${files.length}`);
  const chunks: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8');
    if (name.length > MAX_16) throw new RangeError(`Path too long for a zip: ${file.path}`);
    const deflated = deflateRawSync(file.data);
    const stored = deflated.length >= file.data.length;
    const data = stored ? Buffer.from(file.data) : deflated;
    const method = stored ? METHOD_STORED : METHOD_DEFLATE;
    const crc = crc32(file.data);
    if (file.data.length > MAX_32 || offset > MAX_32) {
      throw new RangeError('Archive too large for a zip without ZIP64');
    }

    const local = Buffer.alloc(LOCAL_HEADER_SIZE);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, data);

    const central = Buffer.alloc(CENTRAL_HEADER_SIZE);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(VERSION, 4);
    central.writeUInt16LE(VERSION, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const directory = Buffer.concat(centrals);
  if (offset > MAX_32 || directory.length > MAX_32) {
    throw new RangeError('Archive too large for a zip without ZIP64');
  }
  const eocd = Buffer.alloc(EOCD_SIZE);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, directory, eocd]);
};
