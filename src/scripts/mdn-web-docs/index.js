import { $ } from '@/utils/selector'
import { warn } from '@/utils/log'

const docsLang = matchLang(location.pathname)
const supports = getSupports()
warn(docsLang)
warn(supports)

function main() {
  if (!supports.length) return

  window.addEventListener('click', event => {
    // 标记是否自行切换语言
    if (event.target === $('.language-menu button[type="submit"]')) {
      sessionStorage.setItem('hand-control-language', true)
    }
  }, true)

  changeLang()
  addLangButton()
}

function changeLang() {
  if (isChinese(docsLang)) return
  // 是否自行切换过语言
  if (sessionStorage.getItem('hand-control-language') === 'true') return

  for (const item of supports) {
    isChinese(matchLang(item)) && location.replace(item)
  }
}

function addLangButton() {
  const values = [] // 中英 排序
  for (const item of supports) {
    const lang = matchLang(item)
    if (isChinese(lang)) {
      values[0] = item
    } else if (isEnglish(lang)) {
      values[1] = item
    }
  }
  warn(values)
  if (values.filter(Boolean).length < 2) return

  const button = document.createElement('a')
  button.innerText = '中-英'
  button.href = isChinese(docsLang) ? values[1] : values[0]
  button.classList.add('button')
  button.style = [
    'position: fixed',
    'right: 0',
    'bottom: 15vh',
    'min-height: auto',
    'padding: 0px 2px',
    'font-size: 12px',
    'letter-spacing: 2px',
  ].join(';')
  button.onclick = function() {
    sessionStorage.setItem('hand-control-language', true)
  }
  document.body.append(button)
}

function matchLang(str) {
  // 匹配 pathname 或字符串
  // /en-US/docs/Web/API/ 或 en-us
  return str.match(/^\/?([\w-]+)/)?.[1]
}

function isChinese(lang) {
  return /zh-cn/i.test(lang)
}

function isEnglish(lang) {
  return /en-US/i.test(lang)
}

function getSupports() {
  return [...($('#language-selector')?.options || [])].map(opt => opt.value)
}

main()
