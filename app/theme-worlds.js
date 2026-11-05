/* theme-worlds.js: THE WORLD BEHIND EACH IDENTITY.

   The owner, 5 November 2026: the whole app centres on four appearances, and
   each is to be vastly different, very 3D and textured. Deep Field keeps its
   generated sky (skyStart in the app). The other three each get a world drawn
   behind the app in real depth:

     midnight  Cyberspace          1999, dialing in: pipes building themselves,
                                   chrome and aqua plastic, gray windows
     dawn      Nature's Roots      an excavation under a Caribbean night: strata
                                   of clay, carvings surfacing, artifacts, cucubanos
     gold      Subterranean Biome  breathing underwater: glowing algae, kelp,
                                   coral, jellyfish, a school of fish, bubbles

   The keys stay midnight, dawn and gold because a theme is stored per profile
   by key, and a rename of the key would drop every reader's choice.

   WHAT THIS FILE OWES THE APP.
   - It is decoration. The canvas is aria-hidden and takes no pointer, and
     nothing here reads or writes the reader's data.
   - Only the active world exists. Choosing another identity disposes the old
     one (geometry, materials, textures, the renderer and its context) before
     the new one is built, and Deep Field builds nothing at all.
   - It holds still under reduced motion: one frame, drawn at a settled
     moment, and no loop. Stillness, not absence, the same rule the sky keeps.
   - It does not draw under the contrast modifier. Hardening is for reading,
     and a world behind the text is the opposite of that.
   - It pauses while the page is hidden, runs at about 30 frames a second, and
     caps the pixel ratio, because it sits behind three other 3D stages.
   - Without WebGL, or when three.js does not load, it reports failure and the
     app keeps the plain atmosphere: nothing breaks.

   three.js is the copy the cover vendors, imported on first use, exactly as
   cycle-scene.js does. Shell layer, global ThemeWorlds. */
(function () {
  'use strict';
  /* The helmet may evaluate a script twice. A second copy would replace the
     global while the first still holds the running world, and stop() would
     then reach the copy that holds nothing. */
  if (window.ThemeWorlds) return;
  var T = null, loading = null, still = false;
  function load() {
    if (T) return Promise.resolve(T);
    if (!loading) loading = import('./three.module.js').then(function (m) { T = m; return m; }, function (e) { loading = null; throw e; });
    return loading;
  }
  function R(a, b) { return a + Math.random() * (b - a); }
  /* value noise */
  var P = []; for (var i0 = 0; i0 < 512; i0++) P[i0] = Math.random();
  function h2(x, y) { return P[((x * 73856093) ^ (y * 19349663)) & 511]; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vn(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = sm(xf), v = sm(yf);
    var a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, o) { var s = 0, a = .5, f = 1; for (var i = 0; i < (o || 5); i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= .5; } return s; }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function sprite(rgb, soft) { var c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(' + rgb + ',1)'); r.addColorStop(soft || .25, 'rgba(' + rgb + ',.5)'); r.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); }
  function ringSprite() { var c = cv(64, 64), g = c.getContext('2d'); g.strokeStyle = 'rgba(220,255,250,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 26, 0, 6.3); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(24, 22, 5, 0, 6.3); g.fill(); return new T.CanvasTexture(c); }
  function cloud(rgb) { var S = 256, c = cv(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), ox = R(0, 99), oy = R(0, 99);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) { var dx = x / S - .5, dy = y / S - .5, f = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2), n = fbm(x / 40 + ox, y / 40 + oy, 5);
      var a = Math.max(0, n - .35) * 1.8 * f * f, k = (y * S + x) * 4; im.data[k] = rgb[0]; im.data[k + 1] = rgb[1]; im.data[k + 2] = rgb[2]; im.data[k + 3] = Math.min(255, a * 255); }
    g.putImageData(im, 0, 0); return new T.CanvasTexture(c); }

  /* ---------- Cyberspace: 1999, dialing in ---------- */
  function bevel(g,x,y,w,h,inset,t){t=t||2;var a=inset?'#808080':'#ffffff',b=inset?'#ffffff':'#404040',a2=inset?'#404040':'#dfdfdf',b2=inset?'#dfdfdf':'#808080';
    g.fillStyle=a;g.fillRect(x,y,w,1);g.fillRect(x,y,1,h);g.fillStyle=b;g.fillRect(x,y+h-1,w,1);g.fillRect(x+w-1,y,1,h);
    if(t>1){g.fillStyle=a2;g.fillRect(x+1,y+1,w-2,1);g.fillRect(x+1,y+1,1,h-2);g.fillStyle=b2;g.fillRect(x+1,y+h-2,w-2,1);g.fillRect(x+w-2,y+1,1,h-2)}}
  function winDraw(g,W,H,title,body){
    g.fillStyle='#c0c0c0';g.fillRect(0,0,W,H);bevel(g,0,0,W,H,false);
    var tg=g.createLinearGradient(6,0,W-6,0);tg.addColorStop(0,'#000080');tg.addColorStop(1,'#1084d0');g.fillStyle=tg;g.fillRect(6,6,W-12,30);
    g.fillStyle='#fff';g.font='bold 17px Tahoma,Verdana,sans-serif';g.textBaseline='middle';g.fillText(title,14,21);
    ['_','□','x'].forEach(function(s,i){var x=W-6-(3-i)*26;g.fillStyle='#c0c0c0';g.fillRect(x,10,22,20);bevel(g,x,10,22,20,false);g.fillStyle='#000';g.font='bold 14px Tahoma,sans-serif';g.textAlign='center';g.fillText(s,x+11,20);g.textAlign='left'});
    body(g);}
  function field(g,x,y,w,h,txt){g.fillStyle='#fff';g.fillRect(x,y,w,h);bevel(g,x,y,w,h,true);if(txt){g.fillStyle='#000';g.font='16px Tahoma,Verdana,sans-serif';g.textBaseline='middle';g.fillText(txt,x+8,y+h/2)}}
  function gbtn(g,x,y,w,h,txt,def){g.fillStyle='#c0c0c0';g.fillRect(x,y,w,h);if(def){g.strokeStyle='#000';g.lineWidth=1;g.strokeRect(x-.5,y-.5,w+1,h+1)}bevel(g,x,y,w,h,false);g.fillStyle='#000';g.font='15px Tahoma,Verdana,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+w/2,y+h/2+1);g.textAlign='left'}
  function envTex(rd){var c=cv(512,256),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
    gr.addColorStop(0,'#05104a');gr.addColorStop(.38,'#7fc8ff');gr.addColorStop(.49,'#ffffff');gr.addColorStop(.52,'#3a3a4a');gr.addColorStop(.7,'#101018');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,512,256);
    [['#3ee8ff',40],['#c49bff',170],['#ffe14d',300],['#ffffff',420]].forEach(function(b){g.fillStyle=b[0];g.globalAlpha=.55;g.fillRect(b[1],60,26,90)});g.globalAlpha=1;
    var t=new T.CanvasTexture(c);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;var pm=new T.PMREMGenerator(rd);var e=pm.fromEquirectangular(t).texture;pm.dispose();return e}
  function cyberspace(c){
    var sc=c.sc,cam=c.cam,rd=c.rd;
    var bg=cv(4,256),bgg=bg.getContext('2d'),gr=bgg.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#00020f');gr.addColorStop(.55,'#00165a');gr.addColorStop(1,'#0b3c96');bgg.fillStyle=gr;bgg.fillRect(0,0,4,256);
    var bt=new T.CanvasTexture(bg);bt.colorSpace=T.SRGBColorSpace;sc.background=bt;sc.environment=envTex(rd);
    cam.position.set(0,0,30);
    sc.add(new T.AmbientLight(0xffffff,.45));var dl=new T.DirectionalLight(0xffffff,2.2);dl.position.set(6,10,14);sc.add(dl);
    var pl=new T.PointLight(0x3ee8ff,260,0,1.5);pl.position.set(-14,-6,10);sc.add(pl);var pl2=new T.PointLight(0xc49bff,200,0,1.5);pl2.position.set(14,8,4);sc.add(pl2);
    /* stars streaming toward you, like the old screensaver */
    var N=1600,sp=new Float32Array(N*3);for(var i=0;i<N;i++){sp[i*3]=R(-90,90);sp[i*3+1]=R(-60,60);sp[i*3+2]=R(-220,25)}
    var sgm=new T.BufferGeometry();sgm.setAttribute('position',new T.BufferAttribute(sp,3));
    sc.add(new T.Points(sgm,new T.PointsMaterial({color:0xffffff,size:.5,map:sprite('255,255,255',.3),transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
    /* 3D pipes building themselves */
    var pipes=new T.Group();pipes.position.set(0,0,-16);sc.add(pipes);
    var pmats=[0x9fb4ff,0xd8d8e4,0xf2d06b,0x3ee8ff,0xc49bff].map(function(col){return new T.MeshStandardMaterial({color:col,metalness:.7,roughness:.16})});
    var sg=new T.CylinderGeometry(.42,.42,1,20),jg=new T.SphereGeometry(.6,22,16),CELL=2.6,G=6,occ={},cur=null,count=0;
    var DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    function key(p){return p.join(',')}
    function fresh(){var p=[Math.round(R(-G,G)),Math.round(R(-G,G)),Math.round(R(-3,3))];cur={p:p,d:DIRS[Math.floor(R(0,6))],m:pmats[Math.floor(R(0,pmats.length))]};occ[key(p)]=1;var j=new T.Mesh(jg,cur.m);j.position.set(p[0]*CELL,p[1]*CELL,p[2]*CELL);pipes.add(j)}
    function step(){if(!cur)fresh();var opts=DIRS.filter(function(d){var n=[cur.p[0]+d[0],cur.p[1]+d[1],cur.p[2]+d[2]];return Math.abs(n[0])<=G&&Math.abs(n[1])<=G&&Math.abs(n[2])<=3&&!occ[key(n)]});
      if(!opts.length){cur=null;return}
      var keep=opts.filter(function(d){return d===cur.d}),d=keep.length&&Math.random()<.72?keep[0]:opts[Math.floor(R(0,opts.length))];
      if(d!==cur.d){var j=new T.Mesh(jg,cur.m);j.position.set(cur.p[0]*CELL,cur.p[1]*CELL,cur.p[2]*CELL);pipes.add(j)}
      var n=[cur.p[0]+d[0],cur.p[1]+d[1],cur.p[2]+d[2]],s=new T.Mesh(sg,cur.m);s.scale.y=CELL;s.position.set((cur.p[0]+n[0])/2*CELL,(cur.p[1]+n[1])/2*CELL,(cur.p[2]+n[2])/2*CELL);
      if(d[0])s.rotation.z=Math.PI/2;if(d[2])s.rotation.x=Math.PI/2;pipes.add(s);cur.p=n;cur.d=d;occ[key(n)]=1;count++;
      if(count>320){while(pipes.children.length)pipes.remove(pipes.children[0]);occ={};cur=null;count=0}}
    for(var i=0;i<(still?260:60);i++)step();
    /* chrome and aqua plastic */
    var chrome=new T.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.06});
    var knot=new T.Mesh(new T.TorusKnotGeometry(2.1,.62,200,28),chrome);knot.position.set(7.5,8,-4);sc.add(knot);
    var bg2=new T.SphereGeometry(2.4,96,64),bp=bg2.attributes.position,v=new T.Vector3();
    for(var i=0;i<bp.count;i++){v.fromBufferAttribute(bp,i);var n=1+.28*Math.sin(v.x*1.6)*Math.sin(v.y*1.9)*Math.sin(v.z*1.4);v.multiplyScalar(n);bp.setXYZ(i,v.x,v.y,v.z)}bg2.computeVertexNormals();
    var blob=new T.Mesh(bg2,chrome);blob.position.set(-8.5,-1,-8);sc.add(blob);
    var aqua=new T.MeshStandardMaterial({color:0x2fc6e8,metalness:.2,roughness:.05,transparent:true,opacity:.62,emissive:0x0a3a5a});
    var bubs=[];for(var i=0;i<9;i++){var b=new T.Mesh(new T.SphereGeometry(R(.4,1.2),40,28),aqua);b.position.set(R(-12,12),R(-11,11),R(-14,2));b.userData={y:b.position.y,p:R(0,6.3)};sc.add(b);bubs.push(b)}
    /* floating windows */
    function winMesh(w,h,draw){var cvs=cv(512,Math.round(512*h/w)),g=cvs.getContext('2d');draw(g,cvs.width,cvs.height);var tx=new T.CanvasTexture(cvs);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
      var side=new T.MeshStandardMaterial({color:0xb8b8c0,roughness:.6}),front=new T.MeshStandardMaterial({map:tx,roughness:.55,metalness:0});
      var m=new T.Mesh(new T.BoxGeometry(w,h,.35),[side,side,side,side,front,side]);m.userData.redraw=function(){draw(g,cvs.width,cvs.height);tx.needsUpdate=true};return m}
    var dots=0,prog=0;
    var signOn=winMesh(11,7.2,function(g,W,H){winDraw(g,W,H,'inCommon Online: Sign On',function(g){
      g.fillStyle='#000';g.font='16px Tahoma,Verdana,sans-serif';g.fillText('Screen Name',22,64);field(g,140,50,350,28,'LibraSun_07');
      g.fillText('Password',22,104);field(g,140,90,350,28,'••••••••');
      g.fillText('Connecting at 56,000 bps'+'....'.slice(0,dots),22,146);field(g,22,162,468,26);
      g.fillStyle='#000080';var nb=Math.floor(prog*26);for(var k=0;k<nb;k++)g.fillRect(26+k*18,166,14,18);
      gbtn(g,256,H-46,110,30,'Sign On',true);gbtn(g,380,H-46,110,30,'Cancel')})});
    signOn.position.set(-11,7,-8);sc.add(signOn);
    var mail=winMesh(8,4.6,function(g,W,H){winDraw(g,W,H,'New Reading',function(g){
      g.fillStyle='#ffe14d';g.beginPath();g.arc(60,108,28,0,6.3);g.fill();g.strokeStyle='#000';g.lineWidth=2;g.stroke();g.fillStyle='#000';g.beginPath();g.arc(50,100,4,0,6.3);g.arc(70,100,4,0,6.3);g.fill();g.beginPath();g.arc(60,110,14,.2,2.9);g.stroke();
      g.font='17px Tahoma,Verdana,sans-serif';g.fillText('You have 1 new reading.',110,96);g.fillText('Sun in Libra, 7th house',110,124);gbtn(g,W-150,H-48,124,30,'Read Now',true)})});
    mail.position.set(11,-7,-4);mail.rotation.y=-.28;sc.add(mail);
    var calc=winMesh(7,3.6,function(g,W,H){winDraw(g,W,H,'chart.exe',function(g){g.fillStyle='#000';g.font='16px Tahoma,Verdana,sans-serif';g.fillText('Calculating houses...',20,70);field(g,20,90,W-40,24);g.fillStyle='#000080';var nb=Math.floor(((prog*1.7)%1)*24);for(var k=0;k<nb;k++)g.fillRect(24+k*19,94,15,16)})});
    calc.position.set(-11,-9,-7);calc.rotation.y=.35;sc.add(calc);
    var wins=[signOn,mail,calc];wins.forEach(function(w,i){w.userData.y=w.position.y;w.userData.p=i*2.1;w.userData.ry=w.rotation.y});
    var acc=0,pacc=0;
    return function(t,dt){
      for(var i=0;i<N;i++){sp[i*3+2]+=dt*26;if(sp[i*3+2]>25)sp[i*3+2]=-220}sgm.attributes.position.needsUpdate=true;
      pacc+=dt;if(pacc>.11&&!still){pacc=0;step()}
      acc+=dt;if(acc>.35){acc=0;dots=(dots+1)%5;prog=(prog+.04)%1.04;signOn.userData.redraw();calc.userData.redraw()}
      knot.rotation.x+=dt*.4;knot.rotation.y+=dt*.6;blob.rotation.y+=dt*.25;blob.rotation.z+=dt*.15;pipes.rotation.y=Math.sin(t*.0001)*.25;
      bubs.forEach(function(b){b.position.y=b.userData.y+Math.sin(t*.0008+b.userData.p)*.8});
      wins.forEach(function(w){w.position.y=w.userData.y+Math.sin(t*.0009+w.userData.p)*.35;w.rotation.y=w.userData.ry+c.mx*.18;w.rotation.x=-c.my*.1});
      cam.position.x+=(c.mx*4-cam.position.x)*.05;cam.position.y+=(-c.my*3-cam.position.y)*.05;cam.lookAt(0,0,-4);
    };
  }

  /* ---------- Nature's Roots: an excavation under a Caribbean night ---------- */
  function roots(c){
    var sc=c.sc,cam=c.cam,rd=c.rd;sc.background=new T.Color('#0a0806');sc.fog=new T.Fog(0x0a0806,34,90);
    rd.shadowMap.enabled=true;rd.shadowMap.type=T.PCFSoftShadowMap;
    cam.position.set(0,12,27);
    function tex(cnv){var t=new T.CanvasTexture(cnv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
    /* the trench wall: strata of clay, pebbles, roots, and carvings coming out of it */
    var TW=1024,TH=640,wc=cv(TW,TH),wg=wc.getContext('2d'),im=wg.createImageData(TW,TH);
    var BANDS=[[44,30,22],[86,56,34],[122,68,38],[150,104,52],[96,84,72],[118,62,36],[70,46,30],[140,96,60],[60,42,30]];
    for(var y=0;y<TH;y++)for(var x=0;x<TW;x++){var w=y/TH*BANDS.length+fbm(x/120,y/80,4)*1.6-.6,bi=Math.max(0,Math.min(BANDS.length-1,Math.floor(w))),b=BANDS[bi],n=.72+fbm(x/9+bi*7,y/9,3)*.5,k=(y*TW+x)*4;
      im.data[k]=b[0]*n;im.data[k+1]=b[1]*n;im.data[k+2]=b[2]*n;im.data[k+3]=255}
    wg.putImageData(im,0,0);
    for(var i=0;i<900;i++){var px=R(0,TW),py=R(0,TH),r=R(1.5,6);wg.fillStyle='rgba('+[200,190,170,140,90][Math.floor(R(0,5))]+','+Math.floor(R(150,190))+','+Math.floor(R(120,160))+','+R(.25,.6)+')';wg.beginPath();wg.ellipse(px,py,r,r*R(.5,.9),R(0,3),0,6.3);wg.fill()}
    wg.strokeStyle='rgba(40,26,16,.7)';for(var i=0;i<26;i++){wg.lineWidth=R(1,3);wg.beginPath();var x0=R(0,TW),y0=R(0,TH*.3);wg.moveTo(x0,y0);for(var k=0;k<8;k++){x0+=R(-18,18);y0+=R(10,30);wg.lineTo(x0,y0)}wg.stroke()}
    var wallBase=wg.getImageData(0,0,TW,TH);
    var carv=[{t:'face',x:.5,y:.42,r:62},{t:'spiral',x:.32,y:.34,r:40},{t:'coqui',x:.66,y:.3,r:40},{t:'sun',x:.7,y:.62,r:44},{t:'face2',x:.28,y:.64,r:46},{t:'zig',x:.5,y:.82,r:110},{t:'spiral',x:.84,y:.44,r:34},{t:'sun',x:.14,y:.4,r:40}];
    function pathFor(m,u,X,Y,r){var a=u*6.283;
      if(m.t==='spiral'){a*=3.2;return[X+Math.cos(a)*r*u,Y+Math.sin(a)*r*u]}
      if(m.t==='zig'){var s=(u*12)%1;return[X-r+u*2*r,Y+(Math.floor(u*12)%2?(1-s):s)*r*.3-r*.15]}
      if(m.t==='coqui'){return[X+Math.cos(a)*r*.55,Y+Math.sin(a)*r*.38]}
      return[X+Math.cos(a)*r*.62,Y+Math.sin(a)*r*.62*(m.t==='face2'?1.15:1)]}
    function carve(k){wg.putImageData(wallBase,0,0);wg.lineCap='round';wg.lineJoin='round';
      carv.forEach(function(m,mi){var q=Math.max(0,Math.min(1,k*carv.length-mi*.75));if(q<=0)return;var X=m.x*TW,Y=m.y*TH,r=m.r;
        function line(cs,lw,ox,oy){wg.strokeStyle=cs;wg.lineWidth=lw;wg.beginPath();var E=Math.floor(140*q);for(var i=0;i<=E;i++){var p=pathFor(m,i/140,X+ox,Y+oy,r);p[0]+=Math.sin(i*1.7)*1.2;p[1]+=Math.cos(i*1.3)*1.2;i?wg.lineTo(p[0],p[1]):wg.moveTo(p[0],p[1])}wg.stroke()}
        line('rgba(20,12,8,.75)',8,1.5,2.5);line('rgba(236,214,176,.85)',5.5,0,0);
        if(q>.96){wg.fillStyle='rgba(236,214,176,.9)';wg.strokeStyle='rgba(236,214,176,.9)';wg.lineWidth=5;
          if(m.t==='face'||m.t==='face2'){[-1,1].forEach(function(s){wg.beginPath();wg.arc(X+s*r*.26,Y-r*.12,r*.13,0,6.3);wg.stroke();wg.beginPath();wg.arc(X+s*r*.26,Y-r*.12,r*.04,0,6.3);wg.fill()});wg.beginPath();wg.ellipse(X,Y+r*.28,r*.22,r*.1,0,0,6.3);wg.stroke();
            if(m.t==='face'){for(var s2=0;s2<9;s2++){var a5=Math.PI+s2/8*Math.PI;wg.beginPath();wg.moveTo(X+Math.cos(a5)*r*.72,Y+Math.sin(a5)*r*.72);wg.lineTo(X+Math.cos(a5)*r*1.05,Y+Math.sin(a5)*r*1.05);wg.stroke()}}}
          if(m.t==='sun'){for(var s3=0;s3<12;s3++){var a6=s3/12*6.283;wg.beginPath();wg.moveTo(X+Math.cos(a6)*r*.78,Y+Math.sin(a6)*r*.78);wg.lineTo(X+Math.cos(a6)*r*1.1,Y+Math.sin(a6)*r*1.1);wg.stroke()}wg.beginPath();wg.arc(X,Y,r*.2,0,6.3);wg.fill()}
          if(m.t==='coqui'){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){wg.beginPath();wg.moveTo(X+s[0]*r*.45,Y+s[1]*r*.2);wg.lineTo(X+s[0]*r*.85,Y+s[1]*r*.55);wg.lineTo(X+s[0]*r*.6,Y+s[1]*r*.85);wg.stroke()});wg.beginPath();wg.arc(X-r*.18,Y-r*.36,r*.08,0,6.3);wg.arc(X+r*.18,Y-r*.36,r*.08,0,6.3);wg.fill()}}
      });wallTex.needsUpdate=true}
    var wallTex=tex(wc),wallGeo=new T.PlaneGeometry(36,20,180,100),wp=wallGeo.attributes.position;
    for(var i=0;i<wp.count;i++){var x=wp.getX(i),y=wp.getY(i);wp.setZ(i,fbm(x*.2+3,y*.2+3,4)*1.4+fbm(x*.9,y*.9,2)*.25)}wallGeo.computeVertexNormals();
    var wall=new T.Mesh(wallGeo,new T.MeshStandardMaterial({map:wallTex,bumpMap:wallTex,bumpScale:1.6,roughness:.96}));wall.position.set(0,1,-10);wall.receiveShadow=true;sc.add(wall);
    var prog=still?1:0;carve(prog);
    /* side walls and floor, same earth */
    var earth=new T.MeshStandardMaterial({map:wallTex,roughness:1,color:0xb09080});
    [-1,1].forEach(function(s){var sw=new T.Mesh(new T.PlaneGeometry(26,20,1,1),earth);sw.position.set(s*18,1,3);sw.rotation.y=-s*Math.PI/2;sw.receiveShadow=true;sc.add(sw)});
    var fc=cv(512,512),fg=fc.getContext('2d'),fim=fg.createImageData(512,512);for(var y=0;y<512;y++)for(var x=0;x<512;x++){var n=.55+fbm(x/30,y/30,5)*.55,k=(y*512+x)*4;fim.data[k]=110*n;fim.data[k+1]=72*n;fim.data[k+2]=44*n;fim.data[k+3]=255}fg.putImageData(fim,0,0);
    fg.strokeStyle='rgba(30,18,10,.35)';fg.lineWidth=2;for(var i=1;i<6;i++){fg.beginPath();fg.moveTo(i*512/6,0);fg.lineTo(i*512/6,512);fg.stroke();fg.beginPath();fg.moveTo(0,i*512/6);fg.lineTo(512,i*512/6);fg.stroke()}
    var floor=new T.Mesh(new T.PlaneGeometry(36,26,60,40),new T.MeshStandardMaterial({map:tex(fc),bumpMap:tex(fc),bumpScale:1,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-9,3);floor.receiveShadow=true;sc.add(floor);
    /* excavation strings and stakes over the trench */
    var sp=[],stake=new T.MeshStandardMaterial({color:0x8a6a44,roughness:.9});
    for(var x=-15;x<=15;x+=5){sp.push(x,-8.6,-9,x,-8.6,14)}for(var z=-9;z<=14;z+=4.6){sp.push(-15,-8.6,z,15,-8.6,z)}
    var sgeo=new T.BufferGeometry();sgeo.setAttribute('position',new T.Float32BufferAttribute(sp,3));sc.add(new T.LineSegments(sgeo,new T.LineBasicMaterial({color:0xf0e2c0,transparent:true,opacity:.55})));
    for(var x=-15;x<=15;x+=5){var st=new T.Mesh(new T.BoxGeometry(.25,1.2,.25),stake);st.position.set(x,-8.6,14);sc.add(st)}
    /* artifacts, half buried */
    function clayTex(base,draw){var c2=cv(512,256),g=c2.getContext('2d'),d=g.createImageData(512,256);for(var y=0;y<256;y++)for(var x=0;x<512;x++){var n=.78+fbm(x/14,y/14,4)*.4,k=(y*512+x)*4;d.data[k]=base[0]*n;d.data[k+1]=base[1]*n;d.data[k+2]=base[2]*n;d.data[k+3]=255}g.putImageData(d,0,0);if(draw)draw(g);return tex(c2)}
    var jarTex=clayTex([168,92,48],function(g){g.strokeStyle='rgba(240,228,204,.9)';g.fillStyle='rgba(240,228,204,.9)';g.lineWidth=5;
      [70,150].forEach(function(y){g.beginPath();for(var x=0;x<=512;x+=16){g.lineTo(x,y+((x/16)%2?-14:14))}g.stroke()});
      for(var x=20;x<512;x+=64){g.beginPath();for(var k=0;k<60;k++){var a=k/60*6.283*2.2,r=k/60*18;g.lineTo(x+Math.cos(a)*r,112+Math.sin(a)*r)}g.stroke()}
      for(var x=8;x<512;x+=22){g.beginPath();g.arc(x,200,4,0,6.3);g.fill()}});
    var jarPts=[];[[0,0],[1.1,.05],[1.7,.5],[1.95,1.3],[1.8,2.2],[1.2,2.9],[.9,3.3],[1.05,3.6],[.98,3.65]].forEach(function(p){jarPts.push(new T.Vector2(p[0],p[1]))});
    var jar=new T.Mesh(new T.LatheGeometry(jarPts,64),new T.MeshStandardMaterial({map:jarTex,bumpMap:jarTex,bumpScale:.5,roughness:.85,side:T.DoubleSide}));jar.position.set(-6.5,-9.6,1);jar.rotation.z=.35;jar.castShadow=true;sc.add(jar);
    var stone=new T.MeshStandardMaterial({color:0x8c8070,roughness:.9,bumpMap:wallTex,bumpScale:.6});
    var cemi=new T.Group(),body=new T.Mesh(new T.SphereGeometry(1,48,32),stone);body.scale.set(2.8,.9,1.3);cemi.add(body);
    var peak=new T.Mesh(new T.ConeGeometry(1.1,2.4,48),stone);peak.position.y=1.3;cemi.add(peak);
    var face=new T.MeshStandardMaterial({color:0x5a5044,roughness:.9});[-1,1].forEach(function(s){var e=new T.Mesh(new T.TorusGeometry(.22,.07,10,24),face);e.position.set(1.95*s>0?2.2:-2.2,.2,.75);e.rotation.y=s*.6;cemi.add(e)});
    cemi.position.set(1,-8.5,4);cemi.rotation.y=-.4;cemi.traverse(function(o){o.castShadow=true});sc.add(cemi);
    var tabTex=clayTex([150,112,72],function(g){g.fillStyle='rgba(44,28,16,.8)';for(var row=0;row<7;row++)for(var x=20;x<490;x+=R(18,30)){var y=24+row*32;g.beginPath();g.moveTo(x,y);g.lineTo(x+10,y+4);g.lineTo(x,y+8);g.fill();g.fillRect(x+9,y+3,R(6,14),2)}});
    var tablet=new T.Mesh(new T.BoxGeometry(3.6,.5,2.4),[stone,stone,new T.MeshStandardMaterial({map:tabTex,bumpMap:tabTex,bumpScale:1.2,roughness:.9}),stone,stone,stone]);tablet.position.set(6.5,-8.8,6);tablet.rotation.set(.08,.5,0);tablet.castShadow=true;sc.add(tablet);
    var zig=new T.Group(),zm=new T.MeshStandardMaterial({map:clayTex([140,96,58]),roughness:.95});[[4,1],[3,.9],[2,.8],[1.1,.7]].forEach(function(s,i){var b=new T.Mesh(new T.BoxGeometry(s[0],s[1],s[0]),zm);b.position.y=i*.85;b.castShadow=true;zig.add(b)});zig.position.set(9.5,-9,-3);zig.rotation.y=.3;sc.add(zig);
    var beads=new T.Group(),bc=[0x3fc1c0,0xefe6d4,0x1a1410,0xd9a441];var curve=new T.CatmullRomCurve3([new T.Vector3(-3,-8.95,9),new T.Vector3(-1,-8.95,10.5),new T.Vector3(1.5,-8.95,10),new T.Vector3(3,-8.95,11.5)]);
    for(var i=0;i<34;i++){var b=new T.Mesh(new T.SphereGeometry(.19,16,12),new T.MeshStandardMaterial({color:bc[i%4],roughness:i%4===0?.3:.6,metalness:0}));b.position.copy(curve.getPoint(i/33));b.castShadow=true;beads.add(b)}sc.add(beads);
    var gorTex=clayTex([226,214,190],function(g){g.strokeStyle='rgba(60,40,24,.85)';g.lineWidth=5;g.beginPath();for(var k=0;k<200;k++){var a=k/200*6.283*3,r=k/200*100;g.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r)}g.stroke();g.beginPath();g.arc(128,128,112,0,6.3);g.stroke()});
    var gorget=new T.Mesh(new T.CylinderGeometry(1.4,1.4,.16,48),[new T.MeshStandardMaterial({color:0xd8ccb4}),new T.MeshStandardMaterial({map:gorTex,roughness:.5}),new T.MeshStandardMaterial({color:0xd8ccb4})]);gorTex.repeat.set(2,1);gorget.position.set(4,-8.85,11);gorget.rotation.set(.1,0,.12);gorget.castShadow=true;sc.add(gorget);
    /* roots from the rim */
    var rootMat=new T.MeshStandardMaterial({color:0x4a3220,roughness:.9});var hang=[];
    for(var i=0;i<9;i++){var pts=[],x0=R(-16,16),cx=x0,cz=-9.2;for(var j=0;j<=10;j++){cx+=R(-1,1);cz+=R(-.1,.5);pts.push(new T.Vector3(cx,11-j*R(1,1.8),cz))}
      var tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),50,R(.12,.35),8,false),rootMat);tube.castShadow=true;var g2=new T.Group();g2.position.set(x0,11,-9);tube.position.set(-x0,-11,9);g2.add(tube);g2.userData={p:R(0,6.3)};sc.add(g2);hang.push(g2)}
    /* light: a lantern on the floor, and the Caribbean night above */
    sc.add(new T.HemisphereLight(0x2c6f73,0x140a06,.55));
    var moon=new T.DirectionalLight(0x8fe6dc,.55);moon.position.set(8,30,10);sc.add(moon);
    var lamp=new T.PointLight(0xffb05a,520,60,1.7);lamp.position.set(-2,-6.5,8);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.003;sc.add(lamp);
    var lg=new T.Sprite(new T.SpriteMaterial({map:sprite('255,176,90',.2),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.6}));lg.position.copy(lamp.position);lg.scale.set(7,7,1);sc.add(lg);
    var lantern=new T.Mesh(new T.CylinderGeometry(.35,.45,.9,16),new T.MeshStandardMaterial({color:0xffd9a0,emissive:0xffa040,emissiveIntensity:2}));lantern.position.set(-2,-8.5,8);sc.add(lantern);
    /* cucubanos: fireflies blinking in the dark */
    var NF=90,fp=new Float32Array(NF*3),fcol=new Float32Array(NF*3),fd=[];for(var i=0;i<NF;i++){fp[i*3]=R(-17,17);fp[i*3+1]=R(-8,12);fp[i*3+2]=R(-8,14);fd.push({p:R(0,30),s:R(.4,1.2),ph:R(0,6.3)})}
    var ffg=new T.BufferGeometry();ffg.setAttribute('position',new T.BufferAttribute(fp,3));ffg.setAttribute('color',new T.BufferAttribute(fcol,3));
    sc.add(new T.Points(ffg,new T.PointsMaterial({map:sprite('255,255,255',.18),size:.9,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
    var ND=300,dp=new Float32Array(ND*3);for(var i=0;i<ND;i++){dp[i*3]=R(-8,4);dp[i*3+1]=R(-9,0);dp[i*3+2]=R(2,13)}var dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dp,3));
    sc.add(new T.Points(dg,new T.PointsMaterial({color:0xffd9a8,size:.08,transparent:true,opacity:.6,depthWrite:false})));
    var acc=0;
    return function(t,dt){
      var fl=1+.08*Math.sin(t*.011)+.05*Math.sin(t*.027)+(still?0:R(-.03,.03));lamp.intensity=520*fl;lg.material.opacity=.45+.2*fl;
      for(var i=0;i<NF;i++){var d=fd[i];d.p+=dt;var cyc=d.p%3.2,on=still?.7:(cyc<.5?Math.sin(cyc/.5*Math.PI):0);fcol[i*3]=1*on;fcol[i*3+1]=.86*on;fcol[i*3+2]=.36*on;
        if(!still){fp[i*3]+=Math.sin(t*.0005*d.s+d.ph)*dt*.6;fp[i*3+1]+=Math.cos(t*.0004*d.s+d.ph)*dt*.4}}
      ffg.attributes.color.needsUpdate=true;ffg.attributes.position.needsUpdate=true;
      for(var i=0;i<ND;i++){dp[i*3+1]+=dt*.12;dp[i*3]+=Math.sin(t*.001+i)*dt*.05;if(dp[i*3+1]>0)dp[i*3+1]=-9}dg.attributes.position.needsUpdate=true;
      hang.forEach(function(g){g.rotation.z=Math.sin(t*.0005+g.userData.p)*.03});
      if(prog<1){acc+=dt;if(acc>.08){acc=0;prog=Math.min(1,prog+.01);carve(prog)}}
      cam.position.x+=(c.mx*5-cam.position.x)*.04;cam.position.y+=(12-c.my*3-cam.position.y)*.04;cam.lookAt(0,-3,-1);
    };
  }

  /* ---------- Subterranean Biome: breathing underwater ---------- */
  function biome(c){
    var sc=c.sc,cam=c.cam;sc.background=new T.Color('#010611');sc.fog=new T.FogExp2(0x020c1c,.028);
    cam.position.set(0,5,28);
    var U={t:{value:0},br:{value:.5}};
    var PAL=[[.24,.92,1],[1,.32,.86],[.62,.42,1],[.2,.55,1],[1,.88,.32]];
    sc.add(new T.AmbientLight(0x10304a,1.2));var top=new T.DirectionalLight(0x6fb8ff,.6);top.position.set(0,30,0);sc.add(top);
    /* sea floor */
    var fgeo=new T.PlaneGeometry(140,140,120,120),fpos=fgeo.attributes.position;for(var i=0;i<fpos.count;i++)fpos.setZ(i,fbm(fpos.getX(i)*.06+2,fpos.getY(i)*.06+2,4)*3);fgeo.computeVertexNormals();
    var floor=new T.Mesh(fgeo,new T.MeshStandardMaterial({color:0x07141e,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-8;sc.add(floor);
    function floorY(x,z){return -8+fbm(x*.06+2,-z*.06+2,4)*3}
    /* bioluminescent algae carpet, rippling in waves of light */
    var NA=7000,ap=new Float32Array(NA*3),ac=new Float32Array(NA*3),ah=new Float32Array(NA);
    for(var i=0;i<NA;i++){var x,z,tries=0;do{x=R(-40,40);z=R(-40,20);tries++}while(fbm(x*.08+9,z*.08+9,3)<.52&&tries<8);ap[i*3]=x;ap[i*3+1]=floorY(x,z)+.15;ap[i*3+2]=z;
      var p=PAL[fbm(x*.03,z*.03,2)>.5?0:(i%5===0?1:i%7===0?4:i%3===0?2:3)];ac[i*3]=p[0];ac[i*3+1]=p[1];ac[i*3+2]=p[2];ah[i]=R(0,6.3)}
    var ag=new T.BufferGeometry();ag.setAttribute('position',new T.BufferAttribute(ap,3));ag.setAttribute('color',new T.BufferAttribute(ac,3));ag.setAttribute('ph',new T.BufferAttribute(ah,1));
    var glowMat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:'uniform float t;uniform float br;attribute vec3 color;attribute float ph;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float d=length(position.xz);float w=.5+.5*sin(d*.35-t*1.6+ph*.3);vA=(.25+.75*w*w)*(.55+.45*br)*(.6+.4*sin(t*2.+ph));vC=color;gl_PointSize=(1.4+2.2*w)*(260./-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vC*vA*a*1.3,a*vA);}'});
    sc.add(new T.Points(ag,glowMat));
    /* kelp ribbons */
    var kelpMat=function(tip){return new T.ShaderMaterial({uniforms:{t:U.t,br:U.br,tip:{value:new T.Color().setRGB(tip[0],tip[1],tip[2])}},side:T.DoubleSide,transparent:true,depthWrite:false,
      vertexShader:'uniform float t;varying float vY;void main(){vec3 p=position;vec4 w=modelMatrix*vec4(0.,0.,0.,1.);float h=uv.y;p.x+=sin(t*.9+h*4.+w.x*.7+w.z*.3)*h*h*2.2;p.z+=cos(t*.7+h*3.+w.x)*h*h*1.2;p.x*=1.-h*.5;vY=h;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader:'uniform vec3 tip;uniform float br;varying float vY;void main(){vec3 base=vec3(.02,.12,.12);vec3 c=mix(base,tip,pow(vY,2.2)*(.7+.5*br));float a=.55+.45*vY;gl_FragColor=vec4(c,a*.85);}'})};
    var kmats=[kelpMat(PAL[0]),kelpMat(PAL[2]),kelpMat(PAL[4])];
    for(var i=0;i<48;i++){var H=R(8,20),kg=new T.PlaneGeometry(R(.5,1),H,1,30);kg.translate(0,H/2,0);var k=new T.Mesh(kg,kmats[i%3]);var x=R(-26,26),z=R(-26,4);if(Math.abs(x)<4&&z>-6)x+=x<0?-6:6;k.position.set(x,floorY(x,z),z);k.rotation.y=R(0,3.1);sc.add(k)}
    /* coral that grows its light at the tips */
    var cmat=[0,1,2,3].map(function(d){var col=d<2?0x1a0c24:0x2a0d3a;return new T.MeshStandardMaterial({color:col,roughness:.7,emissive:new T.Color().setRGB(1,.32,.86),emissiveIntensity:[.05,.15,.45,1.1][d]})});
    var tips=[];
    function branch(par,len,r,d){var g=new T.CylinderGeometry(r*.7,r,len,10);g.translate(0,len/2,0);var m=new T.Mesh(g,cmat[Math.min(3,d)]);par.add(m);
      if(d>=3){var tp=new T.Mesh(new T.SphereGeometry(r*1.3,12,8),cmat[3]);tp.position.y=len;m.add(tp);tips.push(tp);return m}
      var n=d===0?3:2+(Math.random()<.5?1:0);for(var i=0;i<n;i++){var cg=new T.Group();cg.position.y=len;cg.rotation.set(R(-.7,.7),R(0,6.3),R(-.7,.7));m.add(cg);branch(cg,len*R(.62,.8),r*.68,d+1)}return m}
    [[-9,-4],[7,-8],[12,2],[-15,-12]].forEach(function(p,i){var g=new T.Group();g.position.set(p[0],floorY(p[0],p[1]),p[1]);g.scale.setScalar(R(.8,1.3));sc.add(g);branch(g,2.6,.42,0)});
    /* anemones swaying */
    var anem=[];[[-4,6],[4,7],[-12,0],[15,-2],[2,-12]].forEach(function(p,ai){var NT=46,SEG=8,pos=new Float32Array(NT*SEG*2*3),root=new T.Vector3(p[0],floorY(p[0],p[1]),p[1]),dir=[];for(var i=0;i<NT;i++)dir.push({a:R(0,6.3),u:R(.2,1),L:R(1.6,3)});
      var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));var col=PAL[[0,1,2,4,0][ai]];
      var ln=new T.LineSegments(g,new T.LineBasicMaterial({color:new T.Color().setRGB(col[0],col[1],col[2]),transparent:true,opacity:.75,blending:T.AdditiveBlending}));sc.add(ln);
      var tp=new Float32Array(NT*3),tg=new T.BufferGeometry();tg.setAttribute('position',new T.BufferAttribute(tp,3));sc.add(new T.Points(tg,new T.PointsMaterial({map:sprite(Math.round(col[0]*255)+','+Math.round(col[1]*255)+','+Math.round(col[2]*255),.2),size:.6,transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
      var base=new T.Mesh(new T.CylinderGeometry(.7,1,1,20),new T.MeshStandardMaterial({color:0x1a2a3a,emissive:new T.Color().setRGB(col[0],col[1],col[2]),emissiveIntensity:.25}));base.position.copy(root);sc.add(base);
      anem.push({root:root,dir:dir,pos:pos,g:g,tp:tp,tg:tg,NT:NT,SEG:SEG,ph:R(0,6)})});
    /* jellyfish, pulsing */
    var jellies=[];for(var j=0;j<5;j++){var col=PAL[[2,0,1,0,2][j]],cc=new T.Color().setRGB(col[0],col[1],col[2]);
      var bell=new T.Mesh(new T.SphereGeometry(1.5,40,20,0,6.283,0,Math.PI/2),new T.ShaderMaterial({uniforms:{c:{value:cc},br:U.br},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
        vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
        fragmentShader:'uniform vec3 c;uniform float br;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);float rim=smoothstep(.2,0.,vY)*.6;gl_FragColor=vec4(c*(f*1.4+rim+.08)*(.7+.5*br),1.);}'}));
      var jg=new T.Group();jg.add(bell);var core=new T.Sprite(new T.SpriteMaterial({map:sprite(Math.round(col[0]*255)+','+Math.round(col[1]*255)+','+Math.round(col[2]*255),.15),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.55}));core.scale.set(3.2,2.2,1);core.position.y=.4;jg.add(core);
      var NTn=12,SG=18,tpos=new Float32Array(NTn*SG*2*3),tgeo=new T.BufferGeometry();tgeo.setAttribute('position',new T.BufferAttribute(tpos,3));
      jg.add(new T.LineSegments(tgeo,new T.LineBasicMaterial({color:cc,transparent:true,opacity:.55,blending:T.AdditiveBlending})));
      jg.position.set(R(-14,14),R(-4,10),R(-16,6));jg.scale.setScalar(R(.6,1.1));sc.add(jg);jellies.push({g:jg,bell:bell,tpos:tpos,tgeo:tgeo,NT:NTn,SG:SG,ph:R(0,6.3),v:R(.4,.8)})}
    /* a school of fish turning together */
    var NFsh=160,fish=new T.InstancedMesh(new T.ConeGeometry(.13,.55,6).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:0x9ff6ff,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}),NFsh),fo=[],dm=new T.Object3D();
    for(var i=0;i<NFsh;i++)fo.push({a:R(0,6.3),r:R(-1.4,1.4),y:R(-1.2,1.2),z:R(-1.4,1.4),s:R(.9,1.1)});sc.add(fish);
    /* breath: bubbles rise in bursts, like exhaling */
    var NB=260,bpz=new Float32Array(NB*3),bd=[];for(var i=0;i<NB;i++){bpz[i*3+1]=-99;bd.push({v:R(2,4),w:R(0,6.3),live:false})}
    var bgeo=new T.BufferGeometry();bgeo.setAttribute('position',new T.BufferAttribute(bpz,3));sc.add(new T.Points(bgeo,new T.PointsMaterial({map:ringSprite(),size:.42,transparent:true,depthWrite:false,opacity:.85})));
    var bi=0;function exhale(n){for(var k=0;k<n;k++){var d=bd[bi];d.live=true;d.v=R(2.2,4.5);bpz[bi*3]=R(5,7)+R(-.4,.4);bpz[bi*3+1]=R(-3,-1.5);bpz[bi*3+2]=R(10,12);bi=(bi+1)%NB}}
    /* plankton and light from far above */
    var NP=1800,pp=new Float32Array(NP*3);for(var i=0;i<NP;i++){pp[i*3]=R(-40,40);pp[i*3+1]=R(-8,26);pp[i*3+2]=R(-40,24)}var pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pp,3));
    sc.add(new T.Points(pg,new T.PointsMaterial({color:0x9fe8ff,size:.07,transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending})));
    var rc=cv(64,256),rg=rc.getContext('2d'),rgr=rg.createLinearGradient(0,0,0,256);rgr.addColorStop(0,'rgba(140,210,255,.35)');rgr.addColorStop(1,'rgba(140,210,255,0)');rg.fillStyle=rgr;rg.fillRect(0,0,64,256);var rx=tex2(rc);
    function tex2(cc2){var t=new T.CanvasTexture(cc2);t.colorSpace=T.SRGBColorSpace;return t}
    var rays=[];for(var i=0;i<6;i++){var ry=new T.Mesh(new T.PlaneGeometry(R(2,5),46),new T.MeshBasicMaterial({map:rx,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.45,side:T.DoubleSide,fog:false}));ry.position.set(R(-18,18),12,R(-24,-4));ry.rotation.z=R(-.25,.25);sc.add(ry);rays.push(ry)}
    var lastBreath=-1,v3=new T.Vector3();
    return function(t,dt){
      var s=t*.001;U.t.value=still?2:s;var cyc=(s%9)/9,br=cyc<.4?Math.sin(cyc/.4*Math.PI/2):Math.cos((cyc-.4)/.6*Math.PI/2);U.br.value=still?.8:br;
      var bn=Math.floor(s/9);if(bn!==lastBreath&&cyc>.42&&!still){lastBreath=bn;exhale(70)}if(!still&&Math.random()<.08)exhale(1);
      for(var i=0;i<NB;i++){var d=bd[i];if(!d.live)continue;bpz[i*3+1]+=d.v*dt;bpz[i*3]+=Math.sin(s*3+d.w)*dt*.4;if(bpz[i*3+1]>26){d.live=false;bpz[i*3+1]=-99}}bgeo.attributes.position.needsUpdate=true;
      tips.forEach(function(tp,i){tp.scale.setScalar(1+.25*Math.sin(s*2+i))});
      anem.forEach(function(a){var k=0,q=0;for(var i=0;i<a.NT;i++){var dd=a.dir[i],px=a.root.x,py=a.root.y+.5,pz=a.root.z,ca=Math.cos(dd.a),sa=Math.sin(dd.a);
        for(var j=0;j<a.SEG;j++){var u=(j+1)/a.SEG,sw=Math.sin(s*1.3+a.ph+u*2.5+i*.3)*u*.5,nx=a.root.x+ca*dd.u*u*1.6+sw,ny=a.root.y+.5+u*dd.L,nz=a.root.z+sa*dd.u*u*1.6+Math.cos(s+i)*u*.2;
          a.pos[k++]=px;a.pos[k++]=py;a.pos[k++]=pz;a.pos[k++]=nx;a.pos[k++]=ny;a.pos[k++]=nz;px=nx;py=ny;pz=nz}a.tp[q++]=px;a.tp[q++]=py;a.tp[q++]=pz}
        a.g.attributes.position.needsUpdate=true;a.tg.attributes.position.needsUpdate=true});
      jellies.forEach(function(j){var p=Math.sin(s*j.v*3+j.ph),c2=Math.max(0,p);j.bell.scale.set(1-.16*c2,1+.12*c2,1-.16*c2);if(!still){j.g.position.y+=dt*(.25+.7*c2);if(j.g.position.y>18){j.g.position.y=-6}}
        var k=0;for(var i=0;i<j.NT;i++){var a=i/j.NT*6.283,px=Math.cos(a)*1.2*j.bell.scale.x,py=0,pz=Math.sin(a)*1.2*j.bell.scale.x;for(var m=0;m<j.SG;m++){var nx=px+Math.sin(s*1.6+m*.45+i)*.12,ny=py-.42,nz=pz+Math.cos(s*1.3+m*.4+i)*.12;
          j.tpos[k++]=px;j.tpos[k++]=py;j.tpos[k++]=pz;j.tpos[k++]=nx;j.tpos[k++]=ny;j.tpos[k++]=nz;px=nx*.97;py=ny;pz=nz*.97}}j.tgeo.attributes.position.needsUpdate=true});
      for(var i=0;i<NFsh;i++){var f=fo[i],a=s*.35*f.s+f.a*.15,R0=11+f.r,cx=Math.cos(a)*R0,cz=Math.sin(a)*R0*.6-6,cy=3+Math.sin(a*2)*2.5+f.y;
        dm.position.set(cx+f.z*.4,cy,cz+f.z);v3.set(-Math.sin(a)*R0,Math.cos(a*2)*5*.35,Math.cos(a)*R0*.6).add(dm.position);dm.lookAt(v3);dm.updateMatrix();fish.setMatrixAt(i,dm.matrix)}fish.instanceMatrix.needsUpdate=true;
      for(var i=0;i<NP;i++){pp[i*3+1]+=dt*.15;if(pp[i*3+1]>26)pp[i*3+1]=-8}pg.attributes.position.needsUpdate=true;
      rays.forEach(function(r,i){r.material.opacity=.25+.2*Math.sin(s*.5+i)});
      cam.position.x+=(c.mx*6-cam.position.x)*.03;cam.position.y+=(5-c.my*3-cam.position.y)*.03;cam.lookAt(0,1,-2);
    };
  }


  /* ---------- the runner: one world at a time ---------- */
  var BUILD = { midnight: cyberspace, dawn: roots, gold: biome };
  var SCRIM = { midnight: '0,6,40', dawn: '12,7,4', gold: '1,4,14' };
  var cur = null, gen = 0;
  function supported() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  function dispose(w) {
    if (!w) return;
    w.dead = true;
    if (w.raf) cancelAnimationFrame(w.raf);
    window.removeEventListener('resize', w.onResize);
    window.removeEventListener('pointermove', w.onMove);
    document.removeEventListener('visibilitychange', w.onVis);
    var seen = new Set();
    function rel(o) { if (o && !seen.has(o) && typeof o.dispose === 'function') { seen.add(o); try { o.dispose(); } catch (e) {} } }
    try {
      w.sc.traverse(function (o) {
        rel(o.geometry);
        var ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(function (m) { if (!m) return; Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) rel(m[k]); }); rel(m); });
      });
      if (w.sc.background && w.sc.background.isTexture) rel(w.sc.background);
      if (w.sc.environment) rel(w.sc.environment);
    } catch (e) {}
    try { w.rd.dispose(); w.rd.forceContextLoss(); } catch (e) {}
    if (w.canvas && w.canvas.parentNode) w.canvas.parentNode.removeChild(w.canvas);
    if (w.scrim && w.scrim.parentNode) w.scrim.parentNode.removeChild(w.scrim);
  }
  function size(w) {
    var W = Math.max(1, w.host.clientWidth), H = Math.max(1, w.host.clientHeight);
    w.rd.setSize(W, H, false);
    w.cam.aspect = W / H;
    /* The worlds were composed for a frame about as wide as it is tall. A tall
       phone widens the lens instead of cropping the scene to a slot. */
    w.cam.fov = W / H < .8 ? 62 : 50;
    w.cam.updateProjectionMatrix();
  }
  function stop() { var w = cur; cur = null; gen++; dispose(w); }
  /* show(host, key, opts): opts.still holds the world at one frame, opts.onReady
     fires after the first frame is on screen, opts.onFail when it cannot draw. */
  function show(host, key, opts) {
    opts = opts || {};
    if (cur && cur.key === key && cur.host === host && cur.still === !!opts.still) return;
    stop();
    if (!host || !BUILD[key]) return;
    var my = ++gen;
    load().then(function () {
      if (my !== gen) return;
      still = !!opts.still;
      var canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;transition:opacity 1.4s ease';
      var rd;
      try { rd = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'low-power' }); }
      catch (e) { if (opts.onFail) opts.onFail(e); return; }
      rd.setPixelRatio(Math.min(1.25, window.devicePixelRatio || 1));
      host.appendChild(canvas);
      /* THE SCRIM. Type is set straight onto the world in many places (the
         date on Today, a reading's paragraphs), and the contrast gate measures
         against --bg, which cannot see a canvas. So the world is veiled where
         the reading sits, in the identity's own ground colour, deep enough
         that the brightest pixel any of the three worlds draws still leaves
         --tx and --dim above 4.5:1. It thins toward the edges, where the
         world is allowed to be seen. */
      var scrim = document.createElement('div');
      scrim.setAttribute('aria-hidden', 'true');
      var sr = SCRIM[key] || '0,0,0';
      /* a phone shows the same world in a third of the width, so it crowds
         the type harder and is veiled a little deeper */
      var narrow = (window.innerWidth || 1000) < 820, a0 = narrow ? .76 : .7, a1 = narrow ? .7 : .64, a2 = narrow ? .6 : .55;
      scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(130% 95% at 52% 46%,rgba(' + sr + ',' + a0 + ') 0%,rgba(' + sr + ',' + a1 + ') 52%,rgba(' + sr + ',' + a2 + ') 100%)';
      host.appendChild(scrim);
      var sc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, .1, 800);
      var w = { key: key, host: host, canvas: canvas, scrim: scrim, rd: rd, sc: sc, cam: cam, still: still, mx: 0, my: 0, tx: 0, ty: 0, raf: 0, dead: false };
      size(w);
      var tick;
      try { tick = BUILD[key]({ rd: rd, sc: sc, cam: cam, get mx() { return w.mx; }, get my() { return w.my; } }) || function () {}; }
      catch (e) { cur = w; stop(); if (opts.onFail) opts.onFail(e); return; }
      cur = w;
      w.onResize = function () { size(w); if (still) draw(8000, 0); };
      w.onMove = function (e) { w.tx = e.clientX / (window.innerWidth || 1) * 2 - 1; w.ty = e.clientY / (window.innerHeight || 1) * 2 - 1; };
      w.onVis = function () { if (!document.hidden && !still && !w.raf && !w.dead) w.raf = requestAnimationFrame(loop); };
      window.addEventListener('resize', w.onResize);
      if (!still) window.addEventListener('pointermove', w.onMove, { passive: true });
      document.addEventListener('visibilitychange', w.onVis);
      function draw(t, dt) {
        w.mx += (w.tx - w.mx) * .06; w.my += (w.ty - w.my) * .06;
        try { tick(t, dt); rd.render(sc, cam); } catch (e) { stop(); if (opts.onFail) opts.onFail(e); }
      }
      var t0 = performance.now(), last = t0, acc = 0;
      function loop(now) {
        w.raf = 0;
        if (w.dead || document.hidden) return;
        var dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
        /* about thirty frames a second: this sits behind the whole app */
        if (acc >= 1 / 31) { draw(now - t0, Math.min(.05, acc)); acc = 0; }
        w.raf = requestAnimationFrame(loop);
      }
      /* compile off the main thread where the browser can, then reveal */
      var ready = rd.compileAsync ? rd.compileAsync(sc, cam) : Promise.resolve();
      ready.catch(function () {}).then(function () {
        if (w.dead) return;
        draw(still ? 8000 : 0, 0);
        canvas.style.opacity = '1';
        if (opts.onReady) opts.onReady();
        if (!still) { last = performance.now(); w.raf = requestAnimationFrame(loop); }
      });
    }, function (e) { if (my === gen && opts.onFail) opts.onFail(e); });
  }
  window.ThemeWorlds = { supported: supported, show: show, stop: stop, keys: Object.keys(BUILD),
    active: function () { return cur ? cur.key : null; } };
})();
