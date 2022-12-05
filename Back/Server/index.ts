import express from 'express'
import https from 'https'
import fs from 'fs'
import path1 from 'path'
import * as ss from 'simple-statistics'
import morgan from 'morgan'
import dotenv from 'dotenv';
import jsmediatags from 'jsmediatags';

dotenv.config();

const credentials = {
  key: fs.readFileSync('cert/private.key.pem'),
  cert: fs.readFileSync('cert/domain.cert.pem'),
};

async function getDirectories(path: string): Promise<string[]> {
  return (await fs.promises.readdir(path)).filter(async (file) => (await fs.promises.stat(path + '/' + file)).isDirectory());
}

async function getFiles(path: string): Promise<string[]> {
  return (await fs.promises.readdir(path)).filter(async (file) => (await fs.promises.stat(path + '/' + file)).isFile());
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
const httpsServer = https.createServer(credentials, app)
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

app.get('/music/:group', function (req, res) {
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
      res.status(400).send('해당하는 그룹이 존재하지 않습니다.')
      return
  }

  const kindPaths: { kind: musicKind; path: string }[] = []
  if (req.query.kind == undefined) {
    res.status(400).send('종류가 없습니다.')
    return
  }
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

  kindPath = kindPaths[getRandomInt(0, kindPaths.length)]
  randomMusic(
    groupPath,
    kindPath.path
  ).then(({ musicFile, dir }) => {
    let answerCover = path1.join(groupPath, kindPath.path, dir, musicFile);
    result = {
      name: musicFile.substring(4, musicFile.length - 4),
      album: {
        name: dir,
        path: '/cover/' + answerCover.substring(0, answerCover.length - 4),
      },
      group: group,
      kind: kindPath.kind,
      midi: '/midi/' + answerCover,
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

    Promise.all([makeQuestion(), makeQuestion(), makeQuestion(), makeQuestion(), makeQuestion()]).then((elem) => {
      result.questions[getRandomInt(0, 4)] = {
        name: result.name,
        path: result.album.path
      };
      res.json(result)
    });
  }).catch(_e => {
    return
  })


  async function makeQuestion(): Promise<void> {
    let randkindPath: string | undefined
    if (req.query.allkindchoices == undefined) {
      randkindPath = kindPaths[getRandomInt(0, kindPaths.length)].path
    } else {
      randkindPath = kindToFolder(
        getRandomInt(musicKind.anime, musicKind.album),
        group
      )
    }
    if (randkindPath !== undefined) {
      let { musicFile, dir } = await randomMusic(groupPath, randkindPath)
      let musicName = musicFile.substring(4, musicFile.length - 4) //정답과 비교용
      musicFile = musicFile.substring(0, musicFile.length - 4) //확장자 제거

      if (result.questions.findIndex(e => e.name == musicName) == -1 && musicName !== result.name) {
        result.questions.push({
          name: musicName,
          path: '/cover/' + path1.join(groupPath, randkindPath!, dir, musicFile),
        })
        return Promise.resolve()
      } else {
        return makeQuestion()
      }
    } else return makeQuestion()
  }
})

let rank: { [key: string]: { [key: string]: number[] } } = JSON.parse(
  fs.readFileSync('rank.json', 'utf8')
)

app.post('/rank/:group/:music', function (req, res) {
  const group = groups[req.params.group as keyof typeof groups]
  const music = req.params.music
  const time: number = Number(req.body)

  res.status(200).send(rankDataToJson(group, music, time))

  fs.writeFile('rank.json', JSON.stringify(rank), (err) => { })
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

async function randomMusic(
  groupPath: string,
  kindPath: string
): Promise<{ musicFile: string; dir: string }> {
  const dirs = await getDirectories(path1.join(midiPath, groupPath, kindPath))
  const dir = dirs[getRandomInt(0, dirs.length)]
  const files = (await getFiles(path1.join(midiPath, groupPath, kindPath, dir))).filter((file) => file.endsWith('.mp3'))
  const musicFile = files[getRandomInt(0, files.length)]

  if (musicFile == undefined) {
    return randomMusic(groupPath, kindPath);
  } else {
    return { musicFile, dir }
  }
}

async function getCover(albumPath: string, musicName: string): Promise<Buffer> {
  /* 
  1. cover.jpg 검사 
  2. Cover_번호.jpg 검사 
  3. mp3메타데이터 추출 
  4. 파일이없거나 메타데이터 추출중오류-> reject
  */
  return new Promise((resolve, reject) => {
    fs.promises.access(path1.join(mp3Path, albumPath, 'cover.jpg'), fs.constants.F_OK).then(() => {
      fs.readFile(path1.join(mp3Path, albumPath, 'cover.jpg'), (err, data) => {
        resolve(data);
      })
    }).catch(() => {
      let trackNum = musicName.substring(0, 2)
      fs.promises.access(path1.join(mp3Path, albumPath, `Cover_${trackNum}.jpg`), fs.constants.F_OK).then(() => {
        fs.readFile(path1.join(mp3Path, albumPath, `Cover_${trackNum}.jpg`), (err, data) => {
          resolve(data);
        })
      }).catch(() => {
        fs.promises.access(path1.join(mp3Path, albumPath, musicName + '.mp3'), fs.constants.F_OK).then(() => {
          jsmediatags.read(path1.join(mp3Path, albumPath, musicName + '.mp3'), {
            onSuccess: function (result) {
              if (result.tags.picture !== undefined) {
                const { data, format } = result.tags.picture;
                resolve(Buffer.from(data));
              }
            },
            onError: function (error) {
              reject(error);
            }
          });
        }).catch(() => {
          reject()
        })
      });
    });
  });
}


if (process.env.NODE_ENV === 'development') {
  app.get('/', function (req, res) {
    res.sendFile(
      path1.join(__dirname, '../../Front/Pialmot/public', 'index.html')
    )
  })

  app.use('/', express.static('../../Front/Pialmot/public'))
  app.use('/mp3', express.static(mp3Path))
  app.use('/midi', express.static(midiPath))
}

app.get('/cover/*', function (req, res) {
  const path = (req as any).params[0];
  let pos = path.lastIndexOf('/');

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  getCover(
    path.substring(0, pos),
    path.substring(pos + 1)
  ).then((data) => {
    res.status(200).send(data);
  }).catch(() => {
    res.send(fs.readFileSync('white.jpg'))
  })
})

httpsServer.listen(8000, process.env.NODE_ENV === 'development' ? '0.0.0.0' : 'localhost', function () {
  console.log('서버ON')
})