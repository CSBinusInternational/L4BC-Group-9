var GameObject = function(game) {
    BABYLON.Mesh.call(this, "__go__", game.scene);

    this.game = game;

    // The game object is not visible
    this.isVisible = false;

    // A game object can have several children
    this._children = [];

    // tag
    BABYLON.Tags.AddTagsTo(this, GameObject.TAG);
};

GameObject.TAG = "__go__";

GameObject.prototype = Object.create(BABYLON.Mesh.prototype);
GameObject.prototype.constructor = GameObject;

GameObject.prototype.setReady = function() {
    this.computeWorldMatrix(true);
    this._children.forEach(function(child) {
        child.computeWorldMatrix(true);
    });
};

GameObject.prototype.addChildren = function(child) {
    child.parent = this;
    this._children.push(child);
};

GameObject.prototype.isCollidingWith = function(other) {
    // If other is a gameobject, collide each children
    if (BABYLON.Tags.MatchesQuery(other, GameObject.TAG)) {
        for (var i=0; i<this._children.length; i++) {
            for (var j=0; j<other._children.length; j++) {
                if (this._children[i].intersectsMesh(other._children[j], true)) {
                    return true;
                }
            }
        }
    } else {
        // Otherwise, collide each children with other
        for (i=0; i<this._children.length; i++) {
            if (this._children[i].intersectsMesh(other, true)) {
                return true;
            }
        }
    }
};
