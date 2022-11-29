import express from 'express'
import http from 'http'
import fs from 'fs'
import path1 from 'path'
import * as ss from 'simple-statistics'
import sharp from 'sharp'
import morgan from 'morgan'
import dotenv from 'dotenv';
dotenv.config();

function getDirectories(path: string): string[] {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory()
  })
}

function getFiles(path: string): string[] {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isFile()
  })
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

const midiPath = '../../Back/Melodia/output/'
const mp3Path = '../../Back/Melodia/music/'

enum musicKind {
  anime, // 애니 삽입곡
  original, // 오리지널
  single, // 싱글
  game, // 게임 삽입곡
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
app.use(morgan('common'));
const server = http.createServer(app)


/*
오류:
니지동: 싱글
리에라: 유닛, 게임
아쿠아: 오리지널, 싱글
정상:
니지동: anime, original, unit, special, album, game
리에라: anime, original, single, special, album
아쿠아: anime, unit, special, album, game
*/

app.get('/music/:group', async function (req, res) {
  let groupPath = ''
  const group = groups[req.params.group as keyof typeof groups]
  switch (group) {
    case groups.us:
      groupPath = '' // TODO: 폴더명
      break
    case groups.aqours:
      groupPath = 'Aqours' // TODO: 폴더명
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
    album: { name: string; path: string }
    kind: musicKind
    questions: { name: string; path: string }[]
    midi: string
    mp3?: string
  } = undefined as any

  let kindPath: {
    kind: musicKind
    path: string
  }
  let musicFile: string = ''
  let dir: string = ''
  while (true) {
    kindPath = kindPaths[getRandomInt(0, kindPaths.length)]
    let { musicFile: tmp_musicFile, dir: tmp_dir } = randomMusic(
      groupPath,
      kindPath.path
    )

    if (tmp_musicFile !== undefined) {
      musicFile = tmp_musicFile
      dir = tmp_dir
      break
    }
  }

  result = {
    name: musicFile.substring(4, musicFile.length - 4),
    album: {
      name: dir,
      path: '/cover/' + path1.join(groupPath, kindPath.path, dir, musicFile)
    },
    group: group,
    kind: kindPath.kind,
    midi: '/midi/' + path1.join(groupPath, kindPath.path, dir, musicFile),
    mp3:
      req.query.original != undefined
        ? '/mp3/' + path1.join(
          groupPath,
          kindPath.path,
          dir,
          musicFile.substring(0, musicFile.length - 3) + 'mp3'
        )
        : undefined,
    questions: []
  }
  let answerIndex = getRandomInt(0, 4)
  for (let i = 0; i < 5; i++) {
    if (i == answerIndex) {
      result.questions.push({
        name: result.name,
        path: result.album.path.substring(0, result.album.path.length - 4)
      })
    } else {
      const kindPath = kindToFolder(
        getRandomInt(musicKind.anime, musicKind.album),
        group
      )
      if (kindPath !== undefined) {
        let { musicFile, dir } = randomMusic(groupPath, kindPath)
        if (musicFile !== undefined) {
          musicFile = musicFile.substring(0, musicFile.length - 4).substring(4)

          if (result.questions.findIndex(e => e.name == musicFile) == -1)
            result.questions.push({
              name: musicFile,
              path: '/cover/' + path1.join(groupPath, kindPath, dir, musicFile),
            })
          else i--
        } else i--
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

  res.status(200).send(rankDataToJson(group, music, time))

  fs.writeFileSync('rank.json', JSON.stringify(rank))
})

app.get('/rank/:group/:music', function (req, res) {
  const group = groups[req.params.group as keyof typeof groups]
  const music = req.params.music
  res.status(200).send(rankDataToJson(group, music))
})

function rankDataToJson(group: groups, music: string, time?: number) {
  rank[group] = rank[group] ?? {}
  rank[group][music] = rank[group][music] ?? []
  if (time != undefined) {
    rank[group][music].push(time)
    rank[group][music] = rank[group][music].sort((a, b) => a - b)
  }

  let IQR =
    rank[group][music].length > 0
      ? ss.interquartileRange(rank[group][music])
      : 0
  let intervalData = [0, 0, 0, 0, 0]

  if (rank[group][music].length > 0) {
    intervalData = []
    for (let i = 0; i < 5; i++) {
      intervalData.push(
        rank[group][music].filter(
          elem => IQR * i <= elem && elem <= IQR * (i + 1)
        ).length
      )
    }
  }

  let noOutlierData = rank[group][music].filter(
    elem => elem <= IQR * 5
  );

  return JSON.stringify({
    rank: time == undefined ? -1 : rank[group][music].indexOf(time) + 1,
    best: rank[group][music][0],
    average:
      noOutlierData.length > 0
        ? ss.mean(noOutlierData)
        : - 1,
    deviation:
      noOutlierData.length > 0
        ? ss.standardDeviation(noOutlierData)
        : -1,
    interval: {
      IQR,
      count: intervalData
    },
    count: rank[group][music].length,
    pertange:
      time == undefined
        ? -1
        : rank[group][music].indexOf(time) / rank[group][music].length
  })
}

function kindToFolder(kind: musicKind, group: groups): string | undefined {
  let path = ''
  switch (kind) {
    case musicKind.anime:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '[2016-2019] Anime' // TODO: 폴더명
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
          return undefined
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
          return undefined
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
          path = '[2016-2021] Units' // TODO: 폴더명
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
          path = '[2016-2022] Special' // TODO: 폴더명
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
          path = '[2015-2021] Albums' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2018-2021] Albums'
          break
        case groups.liella:
          path = '[2022-2022] Albums'
      }
      break
    case musicKind.game:
      switch (group) {
        case groups.us:
          path = '' // TODO: 폴더명
          break
        case groups.aqours:
          path = '[2016-2021] Game' // TODO: 폴더명
          break
        case groups.nijigasaki:
          path = '[2022-2022] Game'
          break
        case groups.liella:
          return undefined
      }
      break
  }
  return path
}

function randomMusic(
  groupPath: string,
  kindPath: string
): { musicFile: string | undefined; dir: string } {
  const dirs = getDirectories(path1.join(midiPath, groupPath, kindPath))
  const dir = dirs[getRandomInt(0, dirs.length)]
  const files = getFiles(path1.join(midiPath, groupPath, kindPath, dir))
  const musicFile = files[getRandomInt(0, files.length)]
  return { musicFile, dir }
}

async function getCover(albumPath: string, musicName: string): Promise<Buffer> {
  if (fs.existsSync(path1.join(mp3Path, albumPath, 'cover.jpg'))) {
    albumPath = path1.join(mp3Path, albumPath, 'cover.jpg')
  } else {
    let trackNum = musicName.substring(0, 2)
    if (fs.existsSync(path1.join(mp3Path, albumPath, `Cover_${trackNum}.jpg`))) {
      albumPath = path1.join(mp3Path, albumPath, `Cover_${trackNum}.jpg`)
    } else {
      albumPath = 'white.jpg'
    }
  }

  return await sharp(fs.readFileSync(albumPath))
    .resize(1000, 1000)
    .jpeg({ mozjpeg: true })
    .toBuffer().then(data => data)
}

app.get('/', function (req, res) {
  res.sendFile(
    path1.join(__dirname, '../../Front/Pialmot/public', 'index.html')
  )
})

app.use('/', express.static('../../Front/Pialmot/public'))
app.use('/mp3', express.static(mp3Path, { maxAge: 31536000 }))
app.use('/midi', express.static(midiPath, { maxAge: 31536000 }))
app.get('/cover/*', async function (req, res) {
  const path = (req as any).params[0];
  let pos = path.lastIndexOf('/');

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'max-age=31536000')
  res.status(200).send(await getCover(
    path.substring(0, pos),
    path.substring(pos + 1)
  ))
})

server.listen(process.env.PORT, function () {
  console.log('서버ON')
})
