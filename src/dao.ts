import { initLog } from './constant'
import { Collection, CFile, FILESTATUS, colPromise } from './interface'
const mongo = require('mongodb')
const MongoClient = mongo.MongoClient;
const MONGODB_URL = "mongodb://127.0.0.1:27017/yahello";
let dbo = null

// 这条基本没用
function insert(dbo, colName: string, data: Object | Array<Object>) {
  let operate = Array.isArray(data) ? 'insertMany' : 'insertOne'
  dbo.collection(colName)[operate](data)
}

// 没找到就插入
function update (dbo, colName, query, newValues) {
  const set = { $set: newValues};
  dbo.collection(colName).updateOne(query, set, { upsert: true })
}

// 记录目录
function recordCollection (url: string, cl: Collection, status: boolean, mark?) {
  const data = {
    ...cl,
    rUrl: url,
    status,
    changeDate: new Date(),
  }
  if (status) {
    console.log('collection ' + url + ' success')
    data.successCount = data.successCount ? data.successCount + 1 : 1
  } else {
    console.error('collection ' + url + ' failed ' + mark || '')
  }
  if (!cl) return
  update(dbo, 'cosers', { rUrl: url }, data)
}

// 记录文件
function recordFile (url: string, path, file: CFile, status: FILESTATUS) {
  const data = {
    ...file,
    rPath: path,
    rUrl: url,
    status,
    changeDate: new Date(),
  }

  switch(status) {
    case 'FAIL':
      console.error('[ X ] download failed ' + path);
      console.error(url)
      break;

    case 'JUMP':
      console.log(`[ ~ ] jump ${path} `)
      console.log(url)
      break;

    case 'SUCCESS':
      console.log('[ √ ] download success' + path)
      console.log(url)
      break;

    case 'WAIT':
      console.log('[ * ] wait wait wait' + path)
      console.log(url)
      break;
  }
  if (status === 'FAIL') {
    data.failCount = data.failCount ? data.failCount + 1 : 1
  }
  update(dbo, 'files', { rUrl: url }, data)
}

// 数据库查询方法封装
function query (dbo, col, query): colPromise {
  return new Promise((resolve, reject) => {
    dbo.collection(col).find(query).toArray().then(val => {
      resolve(val)
    })
  })
}


export function getflushFile (): colPromise {
  return new Promise((resolve) => {
    query(dbo, 'files', { status: 'FAIL' }).then(list => {
      console.log('query fail file success')
      resolve(list)
    })
  })
}

export function getFlushCollection (): colPromise {
  return new Promise((resolve) => {
    let queryStr = {  status: false  }
    query(dbo, 'cosers', queryStr).then(list => {
      console.log('query fail coser success')
      resolve(list)
    })
  })
}

export function getAllCollection (): colPromise {
  return new Promise((resolve) => {
    query(dbo, 'cosers', {}).then(list => {
      console.log('query all coser success')
      resolve(list)
    })
  })
}

// 链接数据库
export function init () {
  initLog()
  return new Promise((resolve) => {
    MongoClient.connect(MONGODB_URL, function(err, db) {
      if (err) throw err;
      dbo = db.db("makima");
      console.log('data base connected')
      resolve(true)
    });
  })
}


export { recordCollection, recordFile }