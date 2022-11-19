import express from 'express'
import http from 'http'
import fs from 'fs'
import path1 from 'path'

function getDirectories (path: string): string[] {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory()
  })
}

function getFiles (path: string): string[] {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isFile()
  })
}

function getRandomInt (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

enum musicKind {
  anime, // 애니 삽입곡
  original, // 오리지널
  single, // 싱글
  special, // 특전
  album // 정규 앨범
}

enum groups {
  us,
  aqours,
  nijigasaki,
  liella
}
const app = express()
const server = http.createServer(app)

app.get('/', function (req, res) {
  res.send('Hello /')
})

/*
오류:
니지동: 싱글
리에라: 유닛

정상:
니지동: anime, original, unit, special, album
리에라: anime, original, single, special, album
*/

app.get('/music/:group', function (req, res) {
  let path = '../../Back/Melodia/output/'
  const group = groups[req.params.group as keyof typeof groups]
  switch (group) {
    case groups.us:
      path += '' // TODO: 폴더명
      break
    case groups.aqours:
      path += '' // TODO: 폴더명
      break
    case groups.nijigasaki:
      path += 'Nijigasaki Gakuen School Idol Doukoukai/'
      break
    case groups.liella:
      path += 'Liella!/'
      break
    default:
      res.status(404).send('그룹이 존재하지 않습니다.')
  }

  const paths: string[] = []
  for (const kind of req.query.kind as string[]) {
    let tempPath = path
    switch (kind) {
      case 'anime':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            tempPath += '[2020-2022] Anime/'
            break
          case groups.liella:
            tempPath += '[2021-2022] Anime/'
        }
        break
      case 'original':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            tempPath += '[2020-2021] Original Song/'
            break
          case groups.liella:
            tempPath += '[2021-2022] Original Songs/'
        }
        break
      case 'single':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            res
              .status(400)
              .send(
                'Nijigasaki Gakuen School Idol Doukoukai does not have single.'
              )
            break
          case groups.liella:
            tempPath += '[2021-2022] Anime/'
        }
        break
      case 'unit':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            tempPath += '[2020-2022] Units/'
            break
          case groups.liella:
            res.status(400).send('Liella! does not have unit.')
        }
        break
      case 'special':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            tempPath += '[2021-2021] Special/'
            break
          case groups.liella:
            tempPath += '[2021-2022] Special/'
        }
        break
      case 'album':
        switch (group) {
          case groups.us:
            tempPath += '' // TODO: 폴더명
            break
          case groups.aqours:
            tempPath += '' // TODO: 폴더명
            break
          case groups.nijigasaki:
            tempPath += '[2018-2021] Albums/'
            break
          case groups.liella:
            tempPath += '[2022-2022] Albums/'
        }
        break
    }
    paths.push(tempPath)
  }

  const result: Array<{ music: string; buffer: string }> = []
  for (const path of paths) {
    const dirs = getDirectories(path)
    const dir = dirs[getRandomInt(0, dirs.length)]
    const files = getFiles(path + dir)
    const musicFile = files[getRandomInt(0, files.length)]
    result.push({
      music: musicFile.substring(0, musicFile.length - 4),
      buffer: fs.readFileSync(path1.join(path, dir, musicFile), {
        encoding: 'base64'
      })
    })
  }

  res.json(result)
})

server.listen(8000, function () {
  console.log('서버ON')
})
