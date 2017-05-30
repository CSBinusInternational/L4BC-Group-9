var Player = function(game) {

    // Call super constructor
    GameObject.call(this, game);

    // Player position.y
    this.height = 0.75;

    var _this = this;
    this.game.assets['elf'].meshes.forEach(function(m) {
        m.parent = _this;
        _this.addChildren(m);
    });
    this.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    this.position.y = this.height;
    this.rotation.y = Math.PI+Math.PI/8;

    this.setReady();

    // save skeleton
    this.skeleton = this.game.assets['elf'].skeleton;

    // Init variable
    this.init();

    var gravity = -0.015;
    this.getScene().registerBeforeRender(function() {
        if (_this.isJumping > 0) {
            _this.speed += gravity;
            _this.position.y += _this.speed;
            if (_this.position.y <=  _this.height){
                _this.position.y = _this.height;
                _this.isJumping = false;
            }
        }

        _this.position.x += 0.5 * _this.direction;
        if (_this.direction < 0) { // goto left
            if (_this.position.x <= _this.destinationX) {
                _this.position.x = _this.destinationX;
                _this.direction = 0;
            }
        }
        if (_this.direction > 0) { // goto right
            if (_this.position.x >= _this.destinationX) {
                _this.position.x = _this.destinationX;
                _this.direction = 0;
            }
        }
    });
    window.addEventListener("keydown", function(evt) {
        if (evt.keyCode == 32) { //space
            _this.jump();
        }
        if (evt.keyCode == 68 && _this.direction == 0) {
            _this.right(); //d
        }
        if (evt.keyCode == 65 && _this.direction == 0) {
            _this.left(); //a
        }
    });
};

Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;

Player.prototype.jump = function() {
    if (!this.dead) {
        var height = 0.3;
        if (this.isJumping >= 0 && this.isJumping < 2) {
            this.isJumping++;
            this.speed = height;
            this.game.jumpsound.play();
        }
    }
};

Player.prototype.right = function() {
    if (!this.dead) {
        if (this.currentLane < this.game.lanes.nblanes - 1) {
            this.currentLane++;
            this.direction = 1;
            this.destinationX = this.game.lanes.getLanePositionX(this.currentLane);
        }
    }
};

Player.prototype.left = function() {
    if (!this.dead) {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.direction = -1;
            this.destinationX = this.game.lanes.getLanePositionX(this.currentLane);
        }
    }
};

Player.prototype.die = function(callback) {
    this.dead = true;
    this.height = 1;
    callback();
};

Player.prototype.init = function() {

    // Player is not dead
    this.dead = false;

    // Speed
    this.speed = 0;

    // Player is not jumping
    this.isJumping = 0;

    // The destination lane
    this.destinationX = -1;

    // The direction
    this.direction = 0;

    // The initial position
    this.position.z = 0;

    // The current lane
    this.currentLane = Math.floor(this.game.lanes.nblanes /2);
};
