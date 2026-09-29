const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/writing-feed');
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},send(body){this.body=body;},json(body){this.body=body;},end(){}};}
test('live RSS is served with five-minute shared cache',async()=>{
 const original=global.fetch;
 try{global.fetch=async(url)=>{const parsed=new URL(url);assert.equal(parsed.origin+parsed.pathname,'https://thechrisneil.substack.com/feed');assert.equal(parsed.searchParams.get('refresh'),String(Math.floor(Date.now()/300000)));return new Response('<rss><channel><item><title>Newest post</title></item></channel></rss>');};const res=response();await handler({method:'GET'},res);assert.equal(res.code,200);assert.match(res.body,/Newest post/);assert.match(res.headers['Cache-Control'],/s-maxage=300/);}finally{global.fetch=original;}
});
test('upstream errors and invalid feeds are never cached',async()=>{
 const original=global.fetch;
 try{for(const reply of [()=>new Response('unavailable',{status:503}),()=>new Response('<html>error</html>')]){global.fetch=async()=>reply();const res=response();await handler({method:'GET'},res);assert.equal(res.code,502);assert.equal(res.headers['Cache-Control'],'no-store');}}finally{global.fetch=original;}
});
test('only GET is accepted',async()=>{const res=response();await handler({method:'POST'},res);assert.equal(res.code,405);assert.equal(res.headers.Allow,'GET');});
