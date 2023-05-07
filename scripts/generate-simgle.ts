import path from 'path'
import { argv } from 'process'
import fs from 'fs-extra'
import prompts from 'prompts'
import c from 'picocolors'
import { loadQuizByNo, resolveInfo } from './loader'
import { formatToCode } from './actions/utils/formatToCode'
import { getQuestionFullName } from './actions/issue-pr'
import type { QuizMetaInfo } from './types'

// 替换部分中文题目的难度标识为英文
const REPLACE: Record<string, string> = {
  简单: 'easy',
  中等: 'medium',
  困难: 'hard',
}
const LANGRUAGE = 'zh-CN'

async function generateSimgle() {
  console.log(' ')
  let num = argv[argv.length - 1]
  const regex = /^\d+$/
  if (!regex.exec(num)) {
    const result = await prompts([{
      type: 'number',
      name: 'num',
      message: '请输入题目序号：',
    }])
    if (!result?.num)
      return console.log(c.yellow('已取消'))
    num = result.num
  }

  num = String(num).padStart(5, '0')
  const quiz = await loadQuizByNo(num)
  if (!quiz) {
    console.log(' ')
    return console.log(c.yellow(`不存在的题目序号：${num}`))
  }
  let { difficulty, title } = resolveInfo(quiz, LANGRUAGE) as QuizMetaInfo & { difficulty: string }
  if (difficulty in REPLACE)
    difficulty = REPLACE[difficulty]
  const quizePath = path.join(__dirname, '../answers', difficulty)
  const filepath = path.join(quizePath, `${getQuestionFullName(quiz.no, difficulty, title)}.ts`)
  if (fs.existsSync(filepath))
    return console.log(`${c.bold(c.red('文件已存在:'))} ${c.dim(filepath)}`)
  const code = formatToCode(quiz, LANGRUAGE)
  await fs.ensureDir(quizePath)
  await fs.writeFile(filepath, code, 'utf-8')
  console.log(' ')
  console.log(`${c.bold(c.green('已生成:'))} ${c.dim(filepath)}`)
}

generateSimgle()
