var app = app || {};

/*Base*/
fa.Model = Backbone.Model.extend({
    urlRoot: '/',

    sync: function(method, model) {

    }
})

fa.Collection = Backbone.Collection.extend({
    urlRoot: '/',

    sync: function(method, model) {

    },

    select: function(el) {
        this.selected = el;
        el.trigger("select");
    }
})


/*state*/
fa.State = fa.Model.extend({
    defaults: {
        name: '',
        isStart: false,
        isFinal: false
    },

    initialize: function(o) {
        this.position = {};
        this.linkOut = [];
        this.linkIn = [];
        this.setPosition(o.x, o.y);
    },

    setPosition: function(x, y) {
        var dx = x - this.position.x,
            dy = y - this.position.y;
        this.position.x = x;
        this.position.y = y;
        this.trigger('position');
        this.eachLink(function(link) {
            var control;
            if (link.start === link.end) {
                control = link.calControlPoint();
            } else {
                control = link.getControlPoint();
                control.x += dx / 2;
                control.y += dy / 2;
            }
            link.setPosition(control.x, control.y);
        })
    },

    eachLink: function(func) {
        var allLink = _.union(this.linkOut, this.linkIn);
        _.each(allLink, function(element, index, list) {
            func(element);
        })
    },

    toggleStart: function() {
        this.set('isStart', !this.get('isStart'));
    },

    toggleFinal: function() {
        this.set('isFinal', !this.get('isFinal'));
    },

    remove: function() {
        this.stopListening();
        this.collection.remove(this);
        this.trigger('destroy');
    },

    removeLink: function(linkToRemove) {
        this.linkOut = _.without(this.linkOut, linkToRemove);
        this.linkIn = _.without(this.linkIn, linkToRemove);
    },

    toJSON: function(type){
        var data = {};
        data.name = this.get('name');
        data.is_start = this.get('isStart');
        data.is_final = this.get('isFinal');
        data.transition = {};
        _.each(this.linkOut, function(el, i, list){
            var t = el.getTransitionData(type);
            if (data.error){
                throw(data.error);
            } else {
                _.extend(data.transition, el.getTransitionData());
            }
        });
    }
});


fa.StateCollection = fa.Collection.extend({
    model: fa.State,
    sequence: 0,
    nextOrder: function() {
        return this.sequence++;
    }
});


/*link*/
fa.Link = fa.Model.extend({
    defaults: {
        transition: 'ε'
    },

    initialize: function(o) {
        this.start = o.start;
        this.end = o.end;
        this.position = {};
        this.start.linkOut.push(this);
        this.end.linkIn.push(this);
        var control = this.calControlPoint();
        this.setPosition(control.x, control.y);

        this.start.listenTo(this, 'destroy', this.start.removeLink);
        this.end.listenTo(this, 'destroy', this.end.removeLink);
        this.listenTo(this.start, 'destroy', this.remove);
        this.listenTo(this.end, 'destroy', this.remove);
    },

    setPosition: function(x, y) {
        var path = fa.getPath(this.start.position.x, this.start.position.y, this.end.position.x, this.end.position.y, x, y);
        this.position.path = path;
        this.trigger('position');
    },

    calControlPoint: function() {
        var p = {};
        if (this.start === this.end) {
            p.x = this.start.position.x,
            p.y = this.start.position.y - fa.RADIUS * 4;
        } else {
            p.x = (this.start.position.x + this.end.position.x) / 2;
            p.y = (this.start.position.y + this.end.position.y) / 2;
        }
        return p;
    },

    getControlPoint: function() {
        return {
            x: this.position.path[1][1],
            y: this.position.path[1][2]
        }
    },

    calTextPosition: function() {
        var point = fa.getMiddlePoint(this.position.path),
            direction = fa.getDirection(this.position.path),
            rotate = point.alpha % 180;
        if (rotate > 90)
            rotate = rotate - 180;
        var dx = 12 * Math.sin(Raphael.rad(Math.abs(rotate))),
            dy = 12 * Math.cos(Raphael.rad(Math.abs(rotate)));
        rotate = 'r' + rotate;
        return {
            'x': point.x + dx * direction[0],
            'y': point.y + dy * direction[1],
            'transform': rotate //旋转的角度为顺时针
        };
    },

    remove: function() {
        this.collection.remove(this);
        this.stopListening();
        this.trigger('destroy', this);
    },

    getTransitionData: function(type) {
        var data = {},
            items,
            s = this.end.get('name');
        switch(type){
            case 'DFA':
            case 'NFA':
                items = this.get('transition').split(',');
                _.each(items, function(el){data[el.trim()] = s});
                break;
            case 'PDA':
                items = this.get('transition').split(' ');
                data[s] = items;
                break;
            case 'turing':
                break;
            default :
                break;
        }
        return data;
    }
});

fa.LinkCollection = fa.Collection.extend({
    model: fa.Link,

    isExist: function(start, end) {
        for (var i = 0; i < this.length; i++) {
            if (this.at(i).start === start && this.at(i).end === end) {
                return true;
            }
        }
        return false;
    }
});


/*automata*/
fa.Automata = fa.Model.extend({
    defaults: {
        type: 'DFA'
    },

    initialize: function() {
        this.set({
            'state': new fa.StateCollection(),
            'link': new fa.LinkCollection(),
            'final': [],
            'start': null,
            'input': [],
            'stack-input': [],
            'start-stack': '',
            'receive': 'final'
        })
        this.listenTo(this.get('state'), 'remove', this.onStateRemove);
        this.listenTo(this.get('link'), 'remove', this.onLinkRemove);
    },

    addLink: function(start, end) {
        var links = this.get('link');
        if (links.isExist(start, end)) {
            return false;
        } else {
            var link = new fa.Link({
                'start': start,
                'end': end
            });
            links.add(link);
            return true;
        }
    },

    addState: function(state) {
        var states = this.get('state');
        states.add(state);
    },

    select: function(model) {
        if (this.selected)
            this.selected.trigger('unselect');
        this.selected = model;
        if (this.selected)
            this.selected.trigger('select');
        this.trigger('select', model);
    },

    onStateRemove: function(model, collection) {
        if (this.selected === model) {
            this.selected = null;
            this.trigger('select', null);
        }
    },

    onLinkRemove: function(model, collection) {
        if (this.selected === model)
            this.selected = null;
    },

    getData: function() {
        var states = this.get('state').models,
            data = {
                input: [],
                start: null,
                final: [],
                type: '',
                state: {}
            };
        data.type = this.get('type');
        data.start = this.get('start');
        data.final = this.get('final');
        _.each(states, function(el, index, list){
            data.state[el.get('name')] = el.toJSON();
        });
    },

    setData: function(data){

    }
})