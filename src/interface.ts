// $ echo kern.maxfiles=65536 | sudo tee -a /etc/sysctl.conf
// $ echo kern.maxfilesperproc=65536 | sudo tee -a /etc/sysctl.conf
// $ sudo sysctl -w kern.maxfiles=65536
// $ sudo sysctl -w kern.maxfilesperproc=65536
// $ ulimit -n 65536

interface colPromise extends Promise<Array<Collection | CFile>> {}

type FILESTATUS = 'SUCCESS' | 'JUMP' | 'FAIL' | 'WAIT'

interface Res {
  data: Data
}

interface Data {
  files: Array<Collection | CFile>
}

interface Collection {
  name: string
  time: string
  size: number 
  type: 'FOLDER'
  path: string // /Azami/
  url: string
  rUrl?: string
  rPath?: string
  failCount?: number
  successCount?: number
}

interface CFile {
  name: string
  time: string
  size: number
  type: 'FILE'
  path: string
  url: string
  rUrl?: string
  rPath?: string
  status?: FILESTATUS
  failCount?: number
  successCount?: number
  // "name": "0001.webp",
  // "time": "2021-02-18 01:19",
  // "size": 270612,
  // "type": "FILE",
  // "path": "/Azami/Imouto(妹妹)/",
}

export { colPromise, Res, Data, Collection, CFile, FILESTATUS }

