// index for simple celebrations
import {confetti} from './confetti'
import {fireworks} from './fireworks'
import {balloons} from './balloons'
import {emojiConfetti} from './emojiConfetti'

export function playCelebration(name, options = {}){
  if(!name) return
  if(name==='confetti') confetti()
  if(name==='fireworks') fireworks()
  if(name==='balloons') balloons()
  if(name==='emojiConfetti') emojiConfetti(options.emojis)
}
