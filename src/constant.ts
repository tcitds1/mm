
import { CFile, Collection } from './interface'
import { recordFile, recordCollection } from './dao';
import { getflushFile, getAllCollection, getFlushCollection, init } from './dao'
import { handleCollection } from './app'
import exp from 'constants';

const request = require('request')
const fs = require('fs')
export const HEADERS = { }
// 不爬图片
export const onlyFans = false
export const SITE = ''
const RATECOUNT = 200
const COL_RATE_COUNT = 100
// 不怕图片
const NO_DOWNLOAD = true


// 给log加点颜色
export function initLog () {
  let err = console.error
  console.error = function() {
    err('\x1b[31m', ...Array.from(arguments))
  }
  let log = console.log
  console.log = function() {
    log('\x1b[32m', ...Array.from(arguments))
  }
}

// 发请求
export function sendRequest(url, info: Collection | null, again?: number) {
  return new Promise((resolve, reject) => {
    let status = false
    request(encodeURI(url), { timeout: 1000 * 60 * 5 }, (error, response) => {
      if (error) {
        if (!again) {
          sendRequest(url, info, again)
        }
        console.log(info)
        console.log('error123123123')
        reject('1')
      } else {
        if (response) {
          status = true
          resolve(JSON.parse(response.body))
        }
      }
      recordCollection(url, info, status)
    });  
  })
}

// 下图片
export function saveImage(url: string, path: string, file: CFile, again?) {
  const options = {
    timeout: 1000 * 60 * 2,
    url: encodeURI(url), // 不编码会报错 很奇怪
    headers: HEADERS,
    method: 'GET',
  };
  if (fs.existsSync(path)) {
    const data = fs.readFileSync(path)
    // 空文件或者脏数据也需要重下
    if (data.length > 50 && file.status !== 'FAIL') {
      recordFile(url, path, file, 'JUMP')
      return
    }
  }

  // 记录未下载的图片
  if (NO_DOWNLOAD) {
    recordFile(url, path, file, 'WAIT')
    return
  }

  // 记录图片下载日志
  request(options, function (error, response, body) {
    if (error) {
      recordFile(url, path, file, 'FAIL')
      return
    }
    if (response && body.length > 50) {
      recordFile(url, path, file, 'SUCCESS')
    } else {
      recordFile(url, path, file, 'FAIL')
    }
  }).pipe(fs.createWriteStream(path))
};

// 乱序算法
export function shuffle(a) {
  for (let i = a.length; i; i--) {
      let j = Math.floor(Math.random() * i);
      [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
}

// 从数据的3级目录开始
export function clearChildCollection () { 
  getAllCollection().then(list => {
    list = list.filter(item => {
      item.path = item.path || ''
      let res = item.path.match(/\//g)
      return res && res.length === 3
    })
    clearCol(list)
  })
}

// 从访问失败的目录开始
export function clearFailCollection () {
  getFlushCollection().then(list => {
    clearCol(list)
  })
}

// 二级目录开始
export function clearAllCollection () {
  getAllCollection().then(list => {
    list = list.filter(item => {
      item.path = item.path || ''
      let res = item.path.match(/\//g)
      return res && res.length === 2
    })
    clearCol(list)
  })
}

// 爬取方法
function clearCol (list) {
  console.log('总数： ' + list.length)
  console.log(new Date().toTimeString())
  list = shuffle(list)
  console.log(new Date().toTimeString())
  let i = 1;
  setInterval(() => {
    let rList = list.slice(i * COL_RATE_COUNT, (++i) * COL_RATE_COUNT)
    console.log(rList)
    rList.map(item=> {
      let col = {
        name: item.name,
        path: item.path,
        type: "FOLDER" as const,
        size: item.size,
        url: item.url,
        time: item.time,
        successCount: item.successCount
      }
      handleCollection(col)
      // saveImage(item.rUrl, item.rPath, col)
    })
  }, 1000 * 10)
}

// 爬取方法
export function clearFile() {
  getflushFile().then(list => {
    console.log('失败文件总数： ' + list.length)
    console.log(new Date().toTimeString())
    // list = shuffle(list)
    console.log(new Date().toTimeString())
    // console.log(list.length)
    let i = 0
    setInterval(() => {
      let rList = list.slice(i * RATECOUNT, (++i) * RATECOUNT)
      console.log(rList)
      rList.map(item=> {
        let col = {
          name: item.name,
          path: item.path,
          type: "FILE" as const,
          size: item.size,
          url: item.url,
          time: item.time,
          failCount: item.failCount || 0
        }
        saveImage(item.rUrl, item.rPath, col)
      })
    }, 1000 * 10)
  })
}

// 清洗文件 清理目录还是文件
export async function flush () {
  console.log('flush init')
  await init()
  // clearAllCollection()
  // clearFailCollection()
  clearFile()
}