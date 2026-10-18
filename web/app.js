const feedUrl = 'https://raw.githubusercontent.com/xinqisong/uptime/main/api/status.json'
const expected = new Map([['personal-site','https://istsong.com/'],['www','https://www.istsong.com/'],['blog','https://blog.istsong.com/']])
const labels = {up:'正常',degraded:'响应较慢',down:'不可用',unknown:'状态未知'}
const dateText = value => new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
const element = (tag, cls, text) => { const node=document.createElement(tag); if(cls)node.className=cls; if(text!==undefined)node.textContent=text; return node }
let snapshot
let fetching = false
function valid(data) {
  if(!data || !Number.isFinite(Date.parse(data.checkedAt)) || !Array.isArray(data.sites) || data.sites.length!==3 || !Array.isArray(data.incidents))return false
  const seen=new Set()
  for(const site of data.sites){if(!site || !expected.has(site.slug) || expected.get(site.slug)!==site.url || seen.has(site.slug) || !['up','down','degraded'].includes(site.status) || !Number.isFinite(site.responseTime))return false;seen.add(site.slug)}
  return true
}
function metric(label,value,unit='') {
  const node=element('div','metric'); node.append(element('small','',label))
  const strong=element('strong','',value);if(unit)strong.append(element('span','',unit));node.append(strong);return node
}
function chart(site) {
  const box=element('div','chart');const samples=(site.samples||[]).filter(item=>Number.isFinite(item.ms)&&item.ms>=0)
  if(samples.length<2){box.append(element('p','','响应采样正在积累中'));return box}
  const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg')
  svg.setAttribute('viewBox','0 0 260 50');svg.setAttribute('role','img');svg.setAttribute('aria-label','真实响应时间采样趋势')
  const min=Math.min(...samples.map(s=>s.ms));const max=Math.max(...samples.map(s=>s.ms));const span=Math.max(max-min,40)
  const line=document.createElementNS(ns,'polyline');line.setAttribute('points',samples.map((s,i)=>`${i/(samples.length-1)*260},${43-(s.ms-min)/span*36}`).join(' '))
  line.setAttribute('fill','none');line.setAttribute('stroke','#b5f4d5');line.setAttribute('stroke-width','1.8');line.setAttribute('stroke-linejoin','round');svg.append(line);box.append(svg);return box
}
function render(data,fresh) {
  const current=data?.sites||[];const statuses=current.map(s=>s.status)
  const state=!fresh?'unknown':statuses.includes('down')?'down':statuses.includes('degraded')?'degraded':'up'
  document.getElementById('overall-dot').className=`dot ${state}`
  document.getElementById('overall-label').textContent={up:'所有站点运行正常',degraded:'部分站点响应较慢',down:'部分站点暂时不可用',unknown:'暂时无法确认当前状态'}[state]
  document.getElementById('checked-at').textContent=data?`最近检查 ${dateText(data.checkedAt)}${fresh?'':' · 数据待更新'}`:'暂时无法读取监测记录，请稍后重试'
  const monitors=document.getElementById('monitors');monitors.replaceChildren()
  for(const [slug,url] of expected){
    const site=current.find(s=>s.slug===slug);const status=fresh&&site?site.status:'unknown'
    const card=element('article','monitor');const top=element('div','monitor-top');top.append(element('h3','',site?.name||{'personal-site':'个人主站',www:'主站 WWW',blog:'技术笔记'}[slug]))
    const badge=element('span',`badge ${status}`);badge.append(element('span',`dot ${status}`),document.createTextNode(labels[status]));top.append(badge);card.append(top)
    const link=element('a','hostname',new URL(url).hostname+' ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';card.append(link)
    const metrics=element('div','metrics');metrics.append(metric('最近响应',site?String(site.responseTime):'—','ms'),metric('监测以来可用率',site?.uptime||'—'));card.append(metrics)
    if(site){card.append(chart(site));card.append(element('p','sample-note',`自 ${new Date(site.startTime).toLocaleDateString('zh-CN')} 开始记录 · ${site.samples?.length||0} 个响应采样`))}
    monitors.append(card)
  }
  const incidents=document.getElementById('incidents');incidents.replaceChildren()
  if(!data){incidents.append(element('p','muted','暂时无法读取故障记录'));return}
  if(!data.incidents.length){const box=element('div','empty');box.append(element('span','empty-icon','✓'));const text=element('div');text.append(element('h3','','启用监测以来，暂无故障记录'),element('p','','这里会保留检测到的故障与恢复记录。'));box.append(text);incidents.append(box);return}
  for(const incident of data.incidents){if(!incident.url?.startsWith('https://github.com/xinqisong/uptime/issues/'))continue;const link=element('a','incident');link.href=incident.url;link.target='_blank';link.rel='noopener noreferrer';link.append(element('h3','',`${incident.state==='closed'?'已恢复':'处理中'} · ${incident.title}`),element('p','',`${dateText(incident.startedAt)} 开始${incident.closedAt?' · '+dateText(incident.closedAt)+' 恢复':''} ↗`));incidents.append(link)}
}
async function refresh(){
  if(fetching)return;fetching=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000)
  try{const response=await fetch(feedUrl,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('feed unavailable');const data=await response.json();if(!valid(data))throw new Error('invalid feed');snapshot=data;const age=Date.now()-Date.parse(data.checkedAt);render(data,age>=-120000&&age<=1800000)}
  catch{render(snapshot,false)}finally{fetching=false;clearTimeout(timeout)}
}
void refresh()
setInterval(()=>{if(!document.hidden)void refresh()},60000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()})
