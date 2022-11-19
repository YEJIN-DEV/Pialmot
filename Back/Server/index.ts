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

const midiPath = '../../Back/Melodia/output/'
const mp3Path = '../../Back/Melodia/music/'

enum musicKind {
  anime, // 애니 삽입곡
  original, // 오리지널
  single, // 싱글
  unit, // 유닛
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
app.use(express.text())
const server = http.createServer(app)

/*
오류:
니지동: 싱글
리에라: 유닛

정상:
니지동: anime, original, unit, special, album
리에라: anime, original, single, special, album
*/

app.get('/music/:group', function (req, res) {
  let groupPath = ''
  const group = groups[req.params.group as keyof typeof groups]
  switch (group) {
    case groups.us:
      groupPath = '' // TODO: 폴더명
      break
    case groups.aqours:
      groupPath = '' // TODO: 폴더명
      break
    case groups.nijigasaki:
      groupPath = 'Nijigasaki Gakuen School Idol Doukoukai'
      break
    case groups.liella:
      groupPath = 'Liella!'
      break
    default:
      res.status(404).send('그룹이 존재하지 않습니다.')
  }

  const kindPaths: { kind: musicKind; path: string }[] = []
  if (!Array.isArray(req.query.kind)) {
    req.query.kind = [req.query.kind as string]
  }

  for (const kind of req.query.kind as Array<keyof typeof musicKind>) {
    let kindPath = kindToFolder(musicKind[kind], group)
    if (kindPath == undefined) {
      res.status(404).send('존재하지 않는 종류입니다.')
      return
    } else {
      kindPaths.push({ kind: musicKind[kind], path: kindPath })
    }
  }

  let result: {
    name: string
    group: groups
    album: string
    kind: musicKind
    questions: string[]
    midi_buffer: string
    mp3_buffer?: string
  } = undefined as any

  const kindPath = kindPaths[getRandomInt(0, kindPaths.length)]
  const { musicFile, dir } = randomMusic(groupPath, kindPath.path)

  result = {
    name: musicFile.substring(0, musicFile.length - 4),
    album: dir,
    group: group,
    kind: kindPath.kind,
    midi_buffer: fs.readFileSync(
      path1.join(midiPath, groupPath, kindPath.path, dir, musicFile),
      {
        encoding: 'base64'
      }
    ),
    mp3_buffer:
      req.query.original != undefined
        ? fs.readFileSync(
            path1.join(
              mp3Path,
              groupPath,
              kindPath.path,
              dir,
              musicFile.substring(0, musicFile.length - 3) + 'mp3'
            ),
            {
              encoding: 'base64'
            }
          )
        : undefined,
    questions: []
  }

  let answerIndex = getRandomInt(0, 4)
  for (let i = 0; i < 5; i++) {
    if (i == answerIndex) {
      result.questions.push(result.name.substring(4))
    } else {
      const kindPath = kindToFolder(
        getRandomInt(musicKind.anime, musicKind.album),
        group
      )
      if (kindPath !== undefined) {
        let temp = randomMusic(groupPath, kindPath).musicFile
        temp = temp.substring(0, temp.length - 4).substring(4)

        if (result.questions.findIndex(e => e == temp) == -1)
          result.questions.push(temp)
        else i--
      } else i--
    }
  }

  res.json(result)
})

let rank: { [key: string]: { [key: string]: number[] } } = JSON.parse(
  fs.readFileSync('rank.json', 'utf8')
)

app.post('/rank/:group/:music', function (req, res) {
  const group = groups[req.params.group as keyof typeof groups]
  const music = req.params.music
  const time: number = Number(req.body)

  if (rank[group] == undefined) {
    rank[group] = {}
  }

  if (rank[group][music] == undefined) {
    rank[group][music] = []
  }

  rank[group][music].push(time)
  rank[group][music].sort((a, b) => a - b)

  res.status(200).send({
    rank: rank[group][music].indexOf(time) + 1,
    best: rank[group][music][0],
    average:
      rank[group][music].reduce((a, b) => a + b) / rank[group][music].length,
    count: rank[group][music].length,
    pertange: rank[group][music].indexOf(time) / rank[group][music].length
  })

  fs.writeFileSync('rank.json', JSON.stringify(rank))
})

server.listen(8000, function () {
  console.log('서버ON')
})

function kindToFolder (kind: musicKind, group: groups): string | undefined {
  let path = ''
  switch (kind) {
    case musicKind.anime:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2020-2022] Anime'
          break
        case groups.liella:
          path = '[2021-2022] Anime'
      }
      break
    case musicKind.original:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2020-2021] Original Song'
          break
        case groups.liella:
          path = '[2021-2022] Original Songs'
      }
      break
    case musicKind.single:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          return undefined
        case groups.liella:
          path = '[2021-2022] Singles'
      }
      break
    case musicKind.unit:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2020-2022] Units/'
          break
        case groups.liella:
          return undefined
      }
      break
    case musicKind.special:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2021-2021] Special'
          break
        case groups.liella:
          path = '[2021-2022] Special'
      }
      break
    case musicKind.album:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2018-2021] Albums'
          break
        case groups.liella:
          path = '[2022-2022] Albums'
      }
      break
  }
  return path
}

function randomMusic (
  groupPath: string,
  kindPath: string
): { musicFile: string; dir: string } {
  const dirs = getDirectories(path1.join(midiPath, groupPath, kindPath))
  const dir = dirs[getRandomInt(0, dirs.length)]
  const files = getFiles(path1.join(midiPath, groupPath, kindPath, dir))
  const musicFile = files[getRandomInt(0, files.length)]
  return { musicFile, dir }
}
