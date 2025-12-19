let textures = {};
let lastType = undefined;
let fade = 0;
let squish = 0;
let reloads = [];
let lastTex = undefined;

function loadTex(name, defValue){
    let file = Vars.tree.get("chibis/" + name + ".png");
    if(file.exists()){
        let tex = new Texture(file);
        tex.setFilter(Texture.TextureFilter.linear);
        return tex;
    }
    return defValue;
}

Events.run(ClientLoadEvent, e => {
    Vars.content.units().each(u => {
        let mainTex = loadTex(u.name);
        if(mainTex){
            textures[u] = {
                main: mainTex,
                mining: loadTex(u.name + "-mining", mainTex),
                building: loadTex(u.name + "-building", mainTex),
                shooting: loadTex(u.name + "-shooting", mainTex),
            };
        }
    });

    let config = {}
    config[UnitTypes.alpha] = {
        anchor: true
    }
    
    let elem = extend(Element, {
        draw(){
            let width = Math.min(Scl.scl(300), Core.graphics.getWidth()/2);
            if(!Vars.player.dead()){
                let next = Vars.player.unit().type;
                if(lastType != next){
                    fade = Mathf.approachDelta(fade, 0, 0.04);
                    if(fade <= 0.01){
                        lastType = next;
                        reloads = Array(Vars.player.unit().mounts.length);
                        squish = 1;
                    }
                }else{
                    fade = Mathf.approachDelta(fade, 1, 0.04);
                }

                if(reloads.length == Vars.player.unit().mounts.length){
                    for(var i = 0; i < reloads.length; i ++){
                        let val = Vars.player.unit().mounts[i].reload;
                        if(reloads[i] < val){
                            squish = 0.4;
                        }
                        reloads[i] = val;
                    }
                }
	        }else{
                fade = Mathf.approachDelta(fade, 0, 0.04);
	        }
	        
	        if(lastType && textures[lastType] && Vars.state.isGame()){
                let data = textures[lastType];
                let unit = Vars.player.unit();

                let mainTex = 
                    Vars.player.dead() ? data.main : 
                    (
                        unit.mining() ? data.mining :
                        unit.isBuilding() ? data.building :
                        unit.isShooting ? data.shooting :
                        data.main
                    );
                
                if(lastTex != mainTex){
                    squish = Math.max(squish, 0.5);
                    lastTex = mainTex;
                }

                let conf = config[lastType] || {}
                let fin = Interp.swingOut.apply(fade);
                let hOffset = 0;
	            let tex = Draw.wrap(mainTex);
	            let height = width * tex.height / tex.width;
                let squishFactor = 0.2 * squish + Mathf.sin(Time.time, 20, 0.01);
                let floatScl = 50, floatMag = 8;
                let ox = Mathf.sin(Time.time, 100, floatMag * 0.25), oy = Mathf.cos(Time.time + 5, floatScl, floatMag);
	            Draw.rect(tex, width/2 + ox, -height * (1.0 - (conf.anchor ? Math.min(fin, 1) : fin)) + height/2 - height * hOffset + (conf.anchor ? 0 : oy) - 1, width * (1 + squishFactor), height * (1 - (conf.anchor ? 0 : squishFactor)));
	        }

            squish = Mathf.approachDelta(squish, 0, 0.05);
        }
    });
    elem.touchable = Touchable.disabled;
    Core.app.post(() => Vars.ui.hudGroup.addChildAt(0, elem));
})

