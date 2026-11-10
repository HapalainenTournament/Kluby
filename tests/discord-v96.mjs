// v96: share images + Discord session reports. DB part needs a THROWAWAY DATABASE_URL.
process.env.OWNER_CLUB_IDS='555';delete process.env.PASS_ACTIVE_CLUBS;
const O=await import('../og.js');const Dc=await import('../discord.js');
let n=0,fail=0;const check=(m,ok)=>{n++;console.log(`${ok?'PASS':'FAIL'} ${m}`);if(!ok)fail++};
const png=O.toPng(O.clubCardSvg({name:'Skutec FC',wins:1,ties:2,losses:3,form:['W','L']}),1200);
check('club preview renders a 1200×630 PNG',png[1]===0x50&&png.readUInt32BE(16)===1200&&png.readUInt32BE(20)===630);
check('long club names are shortened',O.fit('A'.repeat(80),640,76,40).text.endsWith('…'));
check('webhook URL validation',Dc.WEBHOOK_RE.test('https://discord.com/api/webhooks/123456789012345678/abcDEF_ghi-jklMNOpqrstuvwx')&&!Dc.WEBHOOK_RE.test('https://evil.com/api/webhooks/1/2')&&!Dc.WEBHOOK_RE.test('http://discord.com/api/webhooks/123456789012345678/abcdefabcdefabcdefabcdef'));
const sess={startedAt:'2026-11-09T19:00:00Z',lastMatchAt:'2026-11-09T20:00:00Z',durationMinutes:75,matches:[{played_at:'2026-11-09T19:00:00Z',result:'W',goals:3,opponent_goals:1,opponent:'A',players:[{player_id:'1',player_name:'P1',goals:2,assists:0,rating:9,tackles_made:1},{player_id:'2',player_name:'P2',goals:1,assists:2,rating:7,tackles_made:4}]},{played_at:'2026-11-09T19:30:00Z',result:'L',goals:0,opponent_goals:2,opponent:'B',players:[{player_id:'1',player_name:'P1',rating:6},{player_id:'2',player_name:'P2',rating:8,tackles_made:2}]}]};
const s=O.sessionSummary(sess);
check('session summary record + awards',s.w===1&&s.l===1&&s.gf===3&&s.ga===3&&s.awards[0].title==='MVP of the night'&&s.awards.find(a=>a.title==='Top scorer').player==='P1');
const pl=Dc.discordPayload({club:'555',clubName:'Skutec FC',s});
check('discord payload: embed, image attachment, no mentions',pl.embeds[0].image.url==='attachment://session.png'&&pl.allowed_mentions.parse.length===0&&pl.embeds[0].description.includes('1W 0D 1L'));
if(process.env.DATABASE_URL){
 const {query,migrate,pool}=await import('../db.js');await migrate();
 await query(`DELETE FROM club_webhooks`);await query(`DELETE FROM matches WHERE match_id LIKE 'dc96-%'`);
 const sent=[];globalThis.fetch=async(url,opt)=>{sent.push({url,body:opt?.body});return {ok:true,status:200,json:async()=>({})}};
 const base=Date.now()-3*3600000;
 for(let i=0;i<3;i++){const id='dc96-'+i,at=new Date(base+i*25*60000);await query(`INSERT INTO matches(match_id,platform,played_at,match_type) VALUES($1,'common-gen5',$2,'leagueMatch')`,[id,at]);
  await query(`INSERT INTO match_clubs(match_id,club_id,club_name,goals,result) VALUES($1,'555','Skutec FC',$2,$3),($1,'999','Opp',1,$4)`,[id,i+1,i?'W':'D',i?'L':'D']);
  await query(`INSERT INTO player_match_stats(match_id,player_id,club_id,player_name,position,rating,goals,assists) VALUES($1,'1','555','PursuiitCZ','forward',8.5,$2,1)`,[id,i])}
 const url='https://discord.com/api/webhooks/123456789012345678/abcDEF_ghi-jklMNOpqrstuvwx';
 const h=await Dc.addWebhook({club:'555',platform:'common-gen5',url,clubName:'Skutec FC'});
 check('webhook added with key + test message sent',h.key&&sent.length===1&&String(sent[0].url).startsWith(url));
 let err=null;try{await Dc.addWebhook({club:'777',platform:'common-gen5',url,clubName:'X'})}catch(e){err=e}
 check('non-Pass club cannot add a webhook',err?.status===402);
 // the webhook was created after the session → must not re-post history; simulate an older webhook
 await query(`UPDATE club_webhooks SET last_session_start=NULL`);
 const r1=await Dc.runDiscordJob({clubName:async()=>'Skutec FC'});
 const body=sent.at(-1)?.body;
 check('finished session posted once with image',r1.sent===1&&body?.get?.('files[0]')&&JSON.parse(body.get('payload_json')).embeds[0].title.includes('Skutec FC'));
 const r2=await Dc.runDiscordJob({clubName:async()=>'Skutec FC'});
 check('same session is not posted twice',r2.sent===0);
 check('remove needs the key',!(await Dc.removeWebhook({club:'555',id:h.id,key:'nope'}))&&await Dc.removeWebhook({club:'555',id:h.id,key:h.key}));
 await query(`DELETE FROM matches WHERE match_id LIKE 'dc96-%'`);await pool.end();
}else console.log('SKIP discord DB checks');
console.log(`discord v96: ${n-fail}/${n} PASS`);if(fail)process.exit(1);
