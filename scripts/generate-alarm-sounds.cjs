const fs = require('fs')
const path = require('path')

const outputDir = path.resolve(__dirname, '../android/app/src/main/res/raw')
fs.mkdirSync(outputDir, { recursive: true })

const writeTone = (name, notes) => {
  const rate = 22050
  const duration = notes.reduce((sum, note) => sum + note.duration, 0)
  const samples = Math.floor(rate * duration)
  const buffer = Buffer.alloc(44 + samples * 2)
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + samples * 2, 4); buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40)
  let offset = 44
  let cursor = 0
  notes.forEach(note => {
    const count = Math.floor(rate * note.duration)
    for (let i = 0; i < count; i += 1) {
      const envelope = Math.sin(Math.PI * i / count)
      const sample = Math.sin(2 * Math.PI * note.frequency * i / rate) * envelope * 0.34
      buffer.writeInt16LE(Math.round(sample * 32767), offset)
      offset += 2
    }
    cursor += count
  })
  fs.writeFileSync(path.join(outputDir, name), buffer)
}

writeTone('gentle.wav', [{ frequency: 523.25, duration: .45 }, { frequency: 659.25, duration: .55 }])
writeTone('bell.wav', [{ frequency: 880, duration: .25 }, { frequency: 1174.66, duration: .3 }, { frequency: 880, duration: .35 }])
