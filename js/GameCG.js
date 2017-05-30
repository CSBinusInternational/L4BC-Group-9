Game = function(canvasId) {

    var canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(canvas, true);

    // Contains all loaded assets needed for this state
    this.assets  = [];

    // The state scene
    this.scene   = null;
    this.jumpsound = null;
    this.camera = null;

    this.gamespeed = 0;
    this.obstacleTimer = -1;
    this.obstacleSpawnTime = Game.OBSTACLE_MAX_SPAWNTIME;

    // Resize window event
    var _this = this;
    window.addEventListener("resize", function() {
        _this.engine.resize();
    });

    this.player = null;
    this.lanes = null;

    // Run the game
    this.run();

};

Game.OBSTACLE_MAX_SPAWNTIME = 2500;

Game.prototype = {

    initScene : function() {

        var scene = new BABYLON.Scene(this.engine);

        // Camera attached to the canvas

        var camera = new BABYLON.ArcRotateCamera("", -Math.PI / 2, 1.08, 20, new BABYLON.Vector3(0,0,6), scene);
        camera.attachControl(this.engine.getRenderingCanvas(), false);
        camera.lowerRadiusLimit = 20;
        camera.upperRadiusLimit = 40;
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = (Math.PI / 2) - 0.1;
        this.camera = camera;
        // Hemispheric light to light the scene
        var h = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene);
        h.intensity = 0.3;

        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        return scene;
    },


     //Run the current state

    run : function() {

        this.scene = this.initScene();


        var _this  = this;
        // The loader
        var loader =  new BABYLON.AssetsManager(this.scene);

        var music = new BABYLON.Sound("Jade", "assets/Jade.wav", this.scene, null, { loop: true, autoplay: true });

        this.jumpsound = new BABYLON.Sound("Gunshot", "assets/ball_bounce.wav", this.scene, function () {
            console.log("Sound is now ready to be played.");
        });

        var elf = loader.addMeshTask("elf", "", "./assets/bot/", "bot.babylon");
        elf.onSuccess = function(t) {
            _this.assets[t.name] = {meshes: t.loadedMeshes, skeleton: t.loadedSkeletons[0]};
        };

        var snowman = loader.addMeshTask("snowman", "", "./assets/snowman/", "snowman.babylon");
        snowman.onSuccess = function(t) {
            // Only one mesh here
            var snowman = new BABYLON.Mesh("snowman", _this.scene);
            t.loadedMeshes.forEach(function(m) {
                m.parent = snowman;
            });
            snowman.scaling.scaleInPlace(0.075);
            snowman.rotation.y = -Math.PI/2;
            snowman.setEnabled(false);
            _this.assets[t.name] = {meshes: snowman};
        };

        var rockTask = loader.addMeshTask("rock", "", "./assets/rock/", "rochers.babylon");
        rockTask.onSuccess = function(t) {
            // Only one mesh here
            t.loadedMeshes[0].setEnabled(false);
            t.loadedMeshes[0].convertToFlatShadedMesh();
            t.loadedMeshes[0].position.y = 0.5;
            t.loadedMeshes[0].material.subMaterials[0].emissiveColor = BABYLON.Color3.White(); // snow on the rock
            t.loadedMeshes[0].material.subMaterials[1].diffuseColor = BABYLON.Color3.FromInts(66,87,108);
            _this.assets[t.name] = {meshes: t.loadedMeshes[0]};
        };

        var bigRockTask = loader.addMeshTask("bigrock", "", "./assets/rock/", "rocher_grand.babylon");
        bigRockTask.onSuccess = function(t) {
            // Only one mesh here
            t.loadedMeshes[0].setEnabled(false);
            t.loadedMeshes[0].convertToFlatShadedMesh();
            t.loadedMeshes[0].position.y = 2.8;
            t.loadedMeshes[0].scaling.y -= 0.25;
            _this.assets[t.name] = {meshes: t.loadedMeshes[0]};
        };

        loader.onFinish = function (tasks) {

            // Init the game
            _this._initGame();

            _this.scene.executeWhenReady(function() {
                $(".ready").show();
                $(".score").show();

                _this.engine.runRenderLoop(function () {
                    _this.scene.render();
                });
            });
        };
        loader.load();
    },


     //Start the game.

    start : function() {

        $(".lost").hide();
        $(".ready").show();
        var _this = this;

        // COLLISIONS
        // Check if collision between player and obstacles
        var checkCollisions = function() {
            var obstacles = _this.ob.obstacles;
            for (var i=0; i<obstacles.length; i++) {
                var o = obstacles[i];
                if (_this.player.isCollidingWith(o)) {
                    _this.dead();
                    _this.scene.unregisterBeforeRender(checkCollisions);
                }
            }
        };

        this.scene.registerBeforeRender(checkCollisions);

        this.gamespeed = 0;

        // Init player
        this.player.init();
        this.player.position.x = this.lanes.getMiddleX();

        this.lanes.init();

        this.light.position = this.player.position.clone();
        this.light.position.z += 20;

        var top = this.player.position.clone();
        top.y += 10;
        top.z -= 10;
        this.snow.emitter = top;

        // Start the game when space is pressed
        $(window).keydown(function(evt) {
            if (evt.keyCode == 32) {
                $(".ready").hide();
                _this.gamespeed = 0.2;
                _this.obstacleTimer = Game.OBSTACLE_MAX_SPAWNTIME;
                $(window).off("keydown");
            }
        });

        // Reset camera target
        this.scene.activeCamera.target.z = 0;

        // Remove all obstacles
        var obstacles = this.ob.obstacles;
        obstacles.forEach(function(o) {
            o.dispose();
        });
        this.ob.obstacles = [];
        this.obstacleTimer = -1;
        this.obstacleSpawnTime = Game.OBSTACLE_MAX_SPAWNTIME;
    },

    _initGame : function() {

        var _this = this;

        // LANES
        this.lanes = new Lanes(this);

        // PLAYER
        this.player = new Player(this);

        // SNOW
        this.snow = this._initParticles();

        // LIGHT
        this.light = this._initShadows();

        // OBSTACLES
        this.ob = new ObstacleManager(this);

        // RECYCLE ELEMENTS
        this.scene.registerBeforeRender(function() {
            _this.lanes.recycle();
            _this.ob.recycle();
        });

        // FLOOR
        var floor = BABYLON.Mesh.CreateGround("floor", 1, 1, 1, this.scene);
        floor.position.x = this.lanes.getMiddleX();
        floor.scaling = new BABYLON.Vector3(12*this.lanes.nblanes, 1, 200);
        floor.position.z = 50;
        floor.material = new BABYLON.StandardMaterial("", this.scene);
        floor.material.zOffset = 1;
        floor.material.diffuseTexture = new BABYLON.Texture("assets/snow.jpg", this.scene);
        floor.material.specularColor = BABYLON.Color3.Black();
        floor.material.diffuseTexture.uScale = 10;
        floor.material.diffuseTexture.vScale = 30;
        floor.receiveShadows = true;

        // Moving forward
        this.scene.registerBeforeRender(function() {
            var delta = _this.engine.getDeltaTime(); // 1/60*1000
            var deltap= delta * 60 /1000;

            _this.player.position.z += _this.gamespeed * deltap;
            _this.scene.activeCamera.target.z = _this.player.position.z+1;

            _this.snow.emitter.z = _this.player.position.z-10;
            floor.position.z = _this.player.position.z + 50;
            floor.material.diffuseTexture.vOffset += _this.gamespeed*0.15 * deltap;

            _this.light.position.z = _this.player.position.z + 1;
            if (_this.obstacleTimer != -1) {
                _this.obstacleTimer -= _this.engine.getDeltaTime();
                if (_this.obstacleTimer <= 0 && !_this.player.dead) {
                    _this.ob.send();
                    _this.obstacleTimer = _this.obstacleSpawnTime;
                }
            }
        });

        // Init positions
        this.start();

    },

    _initParticles : function() {

        var snow = new BABYLON.ParticleSystem("particles", 1000, this.scene);
        snow.particleTexture = new BABYLON.Texture("assets/snow.png", this.scene);
        var top = new BABYLON.Vector3(0,10,0);
        snow.emitter = top;
        snow.minEmitBox = new BABYLON.Vector3(-12, 0, -5);
        snow.maxEmitBox = new BABYLON.Vector3(12, 0, 60);
        snow.colorDead = new BABYLON.Color4(1, 1, 1, 0.0);
        snow.minSize = 0.1;
        snow.maxSize = 0.5;
        snow.minLifeTime = 1;
        snow.maxLifeTime = 2;
        snow.emitRate = 500;
        snow.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        snow.gravity = new BABYLON.Vector3(0, -9.81, 0);
        snow.direction1 = new BABYLON.Vector3(0,-1,0);
        snow.direction2 = new BABYLON.Vector3(0,-1,0);
        snow.minAngularSpeed = 0;
        snow.maxAngularSpeed = 2*Math.PI;
        snow.minEmitPower = 1;
        snow.maxEmitPower = 3;
        snow.updateSpeed = 0.004;

        snow.start();

        return snow;
    },

    _initShadows : function() {

        var light = new BABYLON.PointLight("biglight", BABYLON.Vector3.Zero(1, 10, 1), this.scene);
        light.position.y = 100;
        light.range = 200;
        light.intensity = 3;
        light.diffuse = new BABYLON.Color3(1, 1, 1);
        light.specular = new BABYLON.Color3(1, 1, 1);
        return light;
    },

     //The player is dead : stop the game
    dead : function() {

        var _this = this;

        this.gamespeed = 0;

        // Make player die
        this.player.die(function() {

            // Display lose screen
            $(".lost").html("Press space to replay !")
            $(".lost").show();

            // Retry when pressing space
            $(window).keydown(function(evt) {
                if (evt.keyCode == 32) {
                    $(window).off("keydown");
                    _this.start();
                }
            });
        });
    }
};
