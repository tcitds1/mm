// 1. 记录所有 url, path
import { Res, Collection, CFile } from './interface'
import { saveImage, shuffle, onlyFans, sendRequest, SITE } from "./constant";
import { init, recordCollection } from './dao';
const fs = require('fs')

// 第一级网站获取的数据
async function hanleCoser (coser : Collection) {
  const coserPath = `./safe/${coser.name}`
  if (!fs.existsSync(coserPath)) {
    fs.mkdirSync(coserPath)
  }
  const site2 = SITE + '/api/list/1?path=/' + coser.name
  const res = await sendRequest(site2, coser) as Res
  if (res.data) {
    res.data.files.map(item => check(item))
  }
}

// 检查是 collection还是file
async function check (item) {
  if (item.type === 'FOLDER') {
    handleCollection(item)
  } else if (item.type === 'FILE') {
    if (onlyFans) return
    handleImg(item)
  }
}

// 爬取 collection
export async function handleCollection (cl: Collection) {
  const clPath = `./safe${cl.path}${cl.name}`
  if (!fs.existsSync(clPath)) {
    fs.mkdirSync(clPath)
  } else {
    if (fs.lstatSync(clPath).isFile()) {
      fs.unlinkSync(clPath);
      fs.mkdirSync(clPath)
    }
  }
  const site3 = cl.rUrl? cl.rUrl : SITE + '/api/list/1?path=' + cl.path + cl.name
  const res = await sendRequest(site3, cl).catch(e => {
    if (e !== '1') {
      console.log(e)
      recordCollection(site3, cl, false, '未知异常')
    }
  }) as Res
  if (!res) return
  if (res.data) {
    res.data.files.map(file => {
      check(file)
    })
  }
}

// 爬取图片
async function handleImg (file: CFile) {
  const imgPath = `./safe${file.path}${file.name}`
  saveImage(file.url, imgPath, file)
}

async function main() {
  await init()
  const site1 = SITE +'/api/list/1?path=/'
  const res = await sendRequest(site1, null) as Res
  const cosers = shuffle(res.data.files) as [Collection]
  cosers.map(cos => hanleCoser(cos))
  // hanleCoser(cosers[0])
}

main()
setInterval(() => {
  main()
}, 1000 * 60 * 8)




// handleCollection(col)
// 多进程跑一下
// console.log(typeof process.argv[2])
// let cos = process.argv[2]
// if (cos) {
//   hanleCoser(JSON.parse(cos))
// }

// console.error('\x1b[32m', 'I am cyan');  //cyan
// console.error('\x1b[31m', 'I am cyan');  //cyan