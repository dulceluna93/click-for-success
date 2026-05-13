export function confetti(){
  const cvs = document.createElement('canvas')
  cvs.style.position='fixed'
  cvs.style.left='0'
  cvs.style.top='0'
  cvs.width = window.innerWidth
  cvs.height = window.innerHeight
  cvs.style.pointerEvents='none'
  document.body.appendChild(cvs)
  const ctx = cvs.getContext('2d')
  const pieces = []
  for(let i=0;i<200;i++){
    pieces.push({x:Math.random()*cvs.width,y:Math.random()*-cvs.height, vx:(Math.random()-0.5)*4, vy:Math.random()*3+2, size: (Math.random()*8)+4, color: `hsl(${Math.random()*360}deg 70% 60%)` })
  }
  let t=0
  function draw(){
    t+=1
    ctx.clearRect(0,0,cvs.width,cvs.height)
    for(const p of pieces){
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      ctx.fillStyle = p.color
      ctx.fillRect(p.x,p.y,p.size,p.size*0.6)
    }
    if(t<300) requestAnimationFrame(draw)
    else document.body.removeChild(cvs)
  }
  draw()
}
