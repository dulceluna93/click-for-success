export function fireworks(){
  // simple single burst
  const cvs = document.createElement('canvas')
  cvs.style.position='fixed'
  cvs.style.left='0'
  cvs.style.top='0'
  cvs.width = window.innerWidth
  cvs.height = window.innerHeight
  cvs.style.pointerEvents='none'
  document.body.appendChild(cvs)
  const ctx = cvs.getContext('2d')
  const cx = cvs.width/2, cy = cvs.height/3
  const parts = []
  for(let i=0;i<150;i++){
    const a = Math.random()*Math.PI*2
    const s = Math.random()*5+2
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,color:`hsl(${Math.random()*360}deg 80% 60%)`,life:100})
  }
  function frame(){
    ctx.fillStyle='rgba(0,0,0,0.1)'
    ctx.fillRect(0,0,cvs.width,cvs.height)
    for(const p of parts){
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -=1
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill()
    }
    if(parts.some(p=>p.life>0)) requestAnimationFrame(frame)
    else document.body.removeChild(cvs)
  }
  frame()
}
