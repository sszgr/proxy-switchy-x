import { createI18n } from 'vue-i18n'
import zhRaw from '../_locales/zh/messages.json'
import enRaw from '../_locales/en/messages.json'

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

const lang = chrome.i18n.getUILanguage() || 'en'

const i18n = createI18n({
  legacy: false,
  locale: lang,
  fallbackLocale: 'en',

  messages: {
    zh,
    en
  }
})

chrome.storage.sync.get("locale", res => {
  const { locale } = res
  if (locale) {
    i18n.global.locale.value = locale
  }
})

export default i18n

