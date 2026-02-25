import { createI18n } from 'vue-i18n'
import zhRaw from '../_locales/zh/messages.json'
import enRaw from '../_locales/en/messages.json'
import jaRaw from '../_locales/ja/messages.json'
import koRaw from '../_locales/ko/messages.json'
import esRaw from '../_locales/es/messages.json'
import frRaw from '../_locales/fr/messages.json'
import deRaw from '../_locales/de/messages.json'
import ruRaw from '../_locales/ru/messages.json'
import ptBRRaw from '../_locales/pt_BR/messages.json'

function convertChromeMessages(json) {
  const result = {};
  for (const key in json) {
    if (json[key] && json[key].message) {
      result[key] = json[key].message;
    }
  }
  return result;
}

const zh = convertChromeMessages(zhRaw)
const en = convertChromeMessages(enRaw)
const ja = convertChromeMessages(jaRaw)
const ko = convertChromeMessages(koRaw)
const es = convertChromeMessages(esRaw)
const fr = convertChromeMessages(frRaw)
const de = convertChromeMessages(deRaw)
const ru = convertChromeMessages(ruRaw)
const ptBR = convertChromeMessages(ptBRRaw)
const localeAliasMap = {
  'zh-CN': 'zh',
  'zh_CN': 'zh',
  'pt_BR': 'pt-BR',
}

const lang = 'en'

const i18n = createI18n({
  legacy: false,
  locale: lang,
  fallbackLocale: 'en',

  messages: {
    zh,
    en,
    ja,
    ko,
    es,
    fr,
    de,
    ru,
    'pt-BR': ptBR,
  }
})

chrome.storage.sync.get("locale", res => {
  const nextLocale = localeAliasMap[res?.locale] || res?.locale
  if (nextLocale) {
    i18n.global.locale.value = nextLocale
  }
})

export default i18n
