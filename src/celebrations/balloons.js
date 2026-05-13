export function balloons(){
  const container = document.createElement('div')
  container.style.position='fixed'
  container.style.left='0'
  container.style.top='0'
  container.style.width='100%'
  container.style.height='100%'
  container.style.pointerEvents='none'
  document.body.appendChild(container)
  const colors=['#ff6b6b','#ffd93d','#6bcB77','#4da6ff']
  const items = []
  for(let i=0;i<12;i++){
    const b = document.createElement('div')
    b.style.position='absolute'
    b.style.left = (Math.random()*90+5)+'%'
    b.style.bottom = '-20%'
    b.style.width='40px'
    b.style.height='50px'
    b.style.background = colors[i%colors.length]
    b.style.borderRadius='20px 20px 18px 18px'
    b.style.opacity = '0.95'
    b.style.transform = `translateY(0) rotate(${Math.random()*30-15}deg)`
    container.appendChild(b)
    items.push(b)
    const dur = 6000 + Math.random()*6000
    b.animate([{transform:'translateY(0)'},{transform:`translateY(-120vh)`}],{duration:dur,iterations:1,easing:'linear'})
  }
  setTimeout(()=>document.body.removeChild(container),14000)
}
