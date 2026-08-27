from PIL import Image
import json
r=json.load(open('shots/dz.json')); d=r['dpr']; P=14
x0=max(0,int((r['x']-P)*d)); y0=max(0,int((r['y']-P)*d))
box=(x0, y0, int((r['x']+r['w']+P)*d), int((r['y']+r['h']+P)*d))
sil=Image.open('shots/dz-ink.png').convert('RGB').crop(box)
face=Image.open('shots/dz-face.png').convert('RGB').crop(box)
w,h=sil.size; ps,pf=sil.load(),face.load()
def filled(x,y):
    if x<0 or y<0 or x>=w or y>=h: return False
    r2,g2,b2=pf[x,y]
    return not (r2>240 and g2>240 and b2>240)
pts=[]
for y in range(h):
    for x in range(w):
        r1,g1,b1=ps[x,y]
        if not (r1>150 and b1>150 and g1<110): continue
        # 1px のにじみは数えない。まわり1マスに塗りがあれば「届いている」とみなす
        if any(filled(x+dx,y+dy) for dx in (-1,0,1) for dy in (-1,0,1)): continue
        pts.append((x,y))
if not pts:
    print("欠けなし"); raise SystemExit
ex=[(x0+x)/d - r['x'] for x,y in pts]
ey=[(y0+y)/d - r['y'] for x,y in pts]
print(f"★{len(pts)}画素  要素内のx {min(ex):.0f}〜{max(ex):.0f}（幅{r['w']:.0f}） y {min(ey):.0f}〜{max(ey):.0f}")
