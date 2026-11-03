const channelLuminance = (channel) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export const getReadableTextColor = (color, dark = '#111827', light = '#ffffff') => {
  const raw = String(color || '').trim().replace(/^#/, '')
  const normalized = raw.length === 3
    ? raw.split('').map(character => character + character).join('')
    : raw

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return light

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (
    0.2126 * channelLuminance(red)
    + 0.7152 * channelLuminance(green)
    + 0.0722 * channelLuminance(blue)
  )
  const contrastWithDark = (luminance + 0.05) / 0.05
  const contrastWithLight = 1.05 / (luminance + 0.05)

  return contrastWithDark >= contrastWithLight ? dark : light
}
