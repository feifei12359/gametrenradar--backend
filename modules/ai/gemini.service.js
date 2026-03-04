const axios = require('axios')
async function decide(input) {
  const key = process.env.GEMINI_API_KEY || ''
  if (!key) return 0
  const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
  const prompt = `word=${input.word}\ngrowth_rate=${input.growth_rate}\nacceleration=${input.acceleration}\nplatform_score=${input.platform_score}\ndays_since_first_seen=${input.days_since_first_seen}\n0=垃圾词\n1=潜在趋势\n2=高爆发潜力\n只返回一个数字`
  const body = { contents: [{ parts: [{ text: prompt }]}] }
  const res = await axios.post(url, body, { params: { key }, timeout: 20000 })
  const text = res.data && res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content && res.data.candidates[0].content.parts && res.data.candidates[0].content.parts[0] && res.data.candidates[0].content.parts[0].text ? res.data.candidates[0].content.parts[0].text : '0'
  const v = parseInt(String(text).trim().match(/[0-2]/) ? String(text).trim().match(/[0-2]/)[0] : '0', 10)
  return isNaN(v) ? 0 : v
}
module.exports = { decide }
