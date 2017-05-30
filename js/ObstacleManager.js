var ObstacleManager = function(game) {
    this.game = game;

    this.obstacles = [];

    // 1 : rock
    // 2 : big rock
    // 3 : snowman
};

ObstacleManager.prototype.randomNumber = function (min, max) {
    if (min === max) {
        return (min);
    }
    var random = Math.random();
    return Math.floor((random * (max - min)) + min);
};

ObstacleManager.prototype.recycle = function() {

    var _this  = this;
    // recycle obstacles
    for (var i=0; i<this.obstacles.length; i++) {
        var s = this.obstacles[i];
        if (s.position.z < _this.game.player.position.z - 20) {
            s.dispose();
            this.obstacles.splice(i, 1);
            i--;
        }
    }
};

ObstacleManager.prototype.send = function() {

    // Get z pos
    var zpos = this.game.player.position.z + 50;
    // Get pattern
    var p = [];
    for (var i=0; i<9; i++) {
        p.push(this.randomNumber(0,4));
    }

    this.sendPattern(p, zpos);
};

ObstacleManager.prototype.sendPattern = function(pat, zpos) {
    for (var p=0; p<pat.length; p++) {
        // batu kecil
        if (pat[p] == 1)  {
            var o = this.game.assets['rock'].meshes.createInstance("obst"+p);
            o.rotation.y = Math.random()*4;
            o.isVisible = true;
            o.position.x = this.game.lanes.getLanePositionX(p%3);
            o.position.z = zpos;
            this.obstacles.push(o);
        } else
        // batu gede
        if (pat[p] == 2) {
            var b = this.game.assets['bigrock'].meshes.createInstance("big_obst"+p);
            b.rotation.y = Math.random()*2*Math.PI;
            b.isVisible = true;
            b.position.x = this.game.lanes.getLanePositionX(p%3);
            b.position.z = zpos;
            this.obstacles.push(b);
        } else
        // snowman
        if (pat[p] == 3) {
            var s = this.game.assets['snowman'].meshes.clone("snowman"+p);
            s.setEnabled(true);
            s.position.x = this.game.lanes.getLanePositionX(p%3);
            s.position.y = 1;
            s.position.z = zpos;
            this.obstacles.push(s);
        }
        if ((p+1)%3==0) {
            zpos += 5;
        }
    }
};

