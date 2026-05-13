// index for simple celebrations
import {confetti} from './confetti'
import {fireworks} from './fireworks'
import {balloons} from './balloons'

export function playCelebration(name){
  if(!name) return
  if(name==='confetti') confetti()
  if(name==='fireworks') fireworks()
  if(name==='balloons') balloons()
}
