var fa = fa || {};

// base view of automata element
fa.View = Backbone.Model.extend({});


// view of state
fa.StateView = fa.View.extend({
    initRender: function() {
        // new element
        this.circle = this.paper.circle(this.model.position.x, this.model.position.y, fa.RADIUS);
        this.text = this.paper.text(this.model.position.x, this.model.position.y, this.model.get('name'));
        this.circle.view = this.text.view = this;
    },

    // render this view according to model
    renderModel: function() {
        var x = this.model.position.x,
            y = this.model.position.y;
        this.text.attr('text', this.model.get('name'));
        if (this.model.get('isFinal')) {
            if (this.finalSymbol) {
                this.finalSymbol.show();
            } else {
                this.finalSymbol = this.paper.circle(x, y, fa.RADIUS - 5).insertAfter(this.circle);
                this.finalSymbol.view = this;
                $(this.finalSymbol.node).attr('class', $(this.circle.node).attr('class'));
            }
        } else {
            this.finalSymbol && this.finalSymbol.hide();
        }
        if (this.model.get('isStart')) {
            if (this.startSymbol) {
                this.startSymbol.show();
            } else {
                this.startSymbol = this.paper.path([
                    ['M', x - fa.RADIUS * 2.5, y],
                    ['L', x - fa.RADIUS - 3, y]
                ]).attr('arrow-end', 'open-wide-long');
                $(this.startSymbol.node).attr('class', 'line');
                this.startSymbol.view = this;
            }
        } else {
            this.startSymbol && this.startSymbol.hide();
        }
        return this;
    },

    // render this view according to position
    renderPosition: function() {
        var x = this.model.position.x,
            y = this.model.position.y;
        // update state
        this.circle.attr({
            'cx': x,
            'cy': y
        });
        this.text.attr({
            'x': x,
            'y': y
        });
        this.finalSymbol && this.finalSymbol.attr({
            'cx': x,
            'cy': y
        });
        this.startSymbol && this.startSymbol.attr('path', [
            ['M', x - fa.RADIUS * 2, y],
            ['L', x - fa.RADIUS - 2, y]
        ])
    },

    renderSelect: function() {
        $(this.circle.node).attr('class', 'select');
        this.finalSymbol && $(this.finalSymbol.node).attr('class', 'select');
    },

    removeSelect: function() {
        $(this.circle.node).attr('class', '');
        this.finalSymbol && $(this.finalSymbol.node).attr('class', '');
    },

    initialize: function(o) {
        //values
        this.model = o.model;
        this.belong = o.belong;
        this.paper = o.belong.paper;
        this.startLink = [];
        this.endLink = [];

        //init render
        this.initRender();
        this.bindEvents();

        //listen to events
        this.listenTo(this.model, 'change', this.renderModel);
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'select', this.renderSelect);
        this.listenTo(this.model, 'unselect', this.removeSelect);
        this.listenTo(this.model, 'position', this.renderPosition);
    },

    bindEvents: function() {
        var that = this;
        // click event
        function click(e) {
            that.onclick(e);
        }
        this.circle.click(click);
        this.text.click(click);

        // drag event
        this.circle.drag(this.ondragmove, this.ondragstart, this.ondragend, this);
        this.text.drag(this.ondragmove, this.ondragstart, this.ondragend, this);
    },

    onclick: function(e) {
        var automataView = this.belong,
            automata = automataView.model;
        switch (automataView.mode) {
            case fa.SELECT: //选择模式
                automata.select(this.model);
                break;
            case fa.STATE: //状态模式
                break;
            case fa.LINK: //连线模式
                break;
            case fa.REMOVE: //删除模式
                this.model.remove();
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    ondragstart: function() {
        var automataView = this.belong,
            automata = automataView.model;
        switch (automataView.mode) {
            case fa.SELECT:
                automata.select(this.model);
                this.dx = this.dy = 0;
                this.model.eachLink(function(link) {
                    link.trigger('hidetext');
                });
                break;

            case fa.LINK:
                var path = automataView.tipLine.attr('path');
                path[0][1] = this.circle.attr('cx');
                path[0][2] = this.circle.attr('cy');
                automataView.tipLine.attr('path', path);
                break;

            default:
                break;
        }
    },

    ondragmove: function(dx, dy, x, y, e) {
        var automataView = this.belong;
        switch (automataView.mode) {
            case fa.SELECT:
                var cx = dx - (this.dx || 0),
                    cy = dy - (this.dy || 0);
                this.model.setPosition(this.model.position.x + cx, this.model.position.y + cy);
                this.dx = dx;
                this.dy = dy;
                break;

            case fa.LINK:
                var rect = $(this.paper.canvas).parent().offset(),
                    path = automataView.tipLine.attr('path');
                path[1][1] = x - rect.left;
                path[1][2] = y - rect.top;
                automataView.tipLine.attr('path', path).show();
                break;
            default:
                break;
        }
    },

    ondragend: function(e) {
        var automataView = this.belong;
        switch (automataView.mode) {
            case fa.SELECT:
                this.model.eachLink(function(link) {
                    link.trigger('showtext');
                });
                break;

            case fa.LINK:
                try {
                    var endStateView = this.paper.getElementByPoint(e.clientX, e.clientY).view;
                    automataView.model.addLink(this.model, endStateView.model);
                } catch (err) {
                    console.log(err);
                }
                automataView.tipLine.hide();
                break;
            default:
                break;
        }
    },

    remove: function() {
        this.circle.remove();
        this.text.remove();
        this.finalSymbol && this.finalSymbol.remove();
        this.startSymbol && this.startSymbol.remove();
        delete this;
    }
});


// view of state
fa.LinkView = fa.View.extend({
    initRender: function() {
        var path = this.model.position.path;
        this.line = this.paper.path(path);
        this.thickLine = this.paper.path(path);
        this.text = this.paper.text(0, 0, 'ε').attr(this.model.calTextPosition());
        this.control = this.paper.circle(path[1][1], path[1][2], 5);
        this.setStyle();
    },

    setStyle: function() {
        this.line.attr({
            'arrow-end': 'open-wide-long'
        })
        $(this.line.node).attr('class', 'line');
        $(this.thickLine.node).attr('class', 'thick-line');
        $(this.control.node).attr('class', 'control');
        this.control.hide();
    },

    // render this view according to model
    renderModel: function() {
        this.text.attr('text', this.model.get('transition'));
    },

    // render this view according to position
    renderPosition: function() {
        var path = this.model.position.path,
            controlPoint = this.model.getControlPoint();
        this.control.attr({
            'cx': controlPoint.x,
            'cy': controlPoint.y
        });
        this.line.attr('path', path);
        this.thickLine.attr('path', path);
    },

    renderSelect: function() {
        $(this.thickLine.node).attr('class', 'thick-line select');
        this.control.show();
    },

    removeSelect: function() {
        $(this.thickLine.node).attr('class', 'thick-line');
        this.control.hide();
    },

    hideText: function() {
        this.text.hide();
    },

    showText: function() {
        this.text.attr(this.model.calTextPosition()).show();
    },

    initialize: function(o) {
        //values
        this.model = o.model;
        this.belong = o.belong;
        this.paper = o.belong.paper;
        this.start = o.start;
        this.end = o.end;

        //init render
        this.initRender();
        this.bindEvents();

        //listen to events
        this.listenTo(this.model, 'change', this.renderModel);
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'select', this.renderSelect);
        this.listenTo(this.model, 'hidetext', this.hideText);
        this.listenTo(this.model, 'showtext', this.showText);
        this.listenTo(this.model, 'unselect', this.removeSelect);
        this.listenTo(this.model, 'position', this.renderPosition);
    },

    bindEvents: function() {
        var that = this;
        // click event
        function click(e) {
            that.onclick(e);
        }
        this.thickLine.click(click);
        this.line.click(click);

        // drag event
        this.control.drag(this.ondragmove, this.ondragstart, this.ondragend, this);
        this.control.click(function(e) {
            e.stopPropagation();
        });
    },

    onclick: function(e) {
        var automataView = this.belong,
            automata = automataView.model;
        switch (automataView.mode) {
            case fa.SELECT: //选择模式
                automata.select(this.model);
                break;
            case fa.STATE: //状态模式
                break;
            case fa.LINK: //连线模式
                break;
            case fa.REMOVE: //删除模式
                this.model.remove();
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    ondragstart: function(x, y, e) {
        var automataView = this.belong,
            automata = automataView.model;
        switch (automataView.mode) {
            case fa.SELECT:
                this.dx = this.dy = 0;
                this.hideText();
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    ondragmove: function(dx, dy, x, y, e) {
        var automataView = this.belong,
            automata = automataView.model;
        switch (automataView.mode) {
            case fa.SELECT:
                var cx = dx - (this.dx || 0),
                    cy = dy - (this.dy || 0),
                    controlPoint = this.model.getControlPoint();
                this.model.setPosition(controlPoint.x + cx, controlPoint.y + cy);
                this.dx = dx;
                this.dy = dy;
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    ondragend: function(e) {
        var automataView = this.belong;
        switch (automataView.mode) {
            case fa.SELECT:
                this.showText();
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    remove: function() {
        this.control.remove();
        this.line.remove();
        this.thickLine.remove();
        this.text.remove();
        delete this;
    }
});

// view of fa
fa.AutomataView = Backbone.View.extend({
    template: _.template($('#fa-template').html()),

    events: {
        'click button[target^="mode"]': 'setMode',
        'click div[domain^="state-type"] button': 'setStateType',
        'click div[domain^="fa-type"] a': 'setAutomataType',
        'blur div[domain^="name"] input': 'inputDone',
        'keydown div[domain^="name"] input': 'onEnter'
    },

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    renderOnChange: function() {
        this.$('div[domain^="fa-type"] button').html(this.model.get('type') + ' <span class="caret">');
    },

    initialize: function(o) {
        this.model = o.model;
        this.mode = fa.STATE;

        this.render().$el.appendTo($(o.element));
        this.initPaper(o);

        this.listenTo(this.model.get('state'), 'add', this.newStateView);
        this.listenTo(this.model.get('link'), 'add', this.newLinkView);
        this.listenTo(this.model, 'select', this.onSelect);
        this.listenTo(this.model, 'change', this.renderOnChange);
    },

    initPaper: function(o) {
        var that = this,
            element = this.$el.find('.fa-paper-wrap'),
            width = o.width || '100%',
            height = o.height || 400;
        this.paper = Raphael(element[0], width, height);
        this.paper.canvas.onclick = function(e) {
            that.onclick(e);
        };
        this.tipLine = this.paper.path('M0 0 L0 0').hide();
    },

    onclick: function(e) {
        var rect = $(this.paper.canvas).parent().offset(), //.getBoundingClientRect(),
            x = e.clientX + window.scrollX - rect.left,
            y = e.clientY + window.scrollY- rect.top;
        switch (this.mode) {
            case fa.SELECT:
                this.model.select(null);
                break;
            case fa.STATE: //状态模式
                var state = new fa.State({
                    'name': 'q' + this.model.get('state').nextOrder(),
                    'x': x,
                    'y': y
                });
                this.model.get('state').add(state);
                break;
            default:
                break;
        }
        e.stopPropagation();
    },

    onEnter: function(e) {
        if (e.which === 13) {
            this.updateTitle(e);
        }
    },

    newStateView: function(state) {
        var view = new fa.StateView({
            model: state,
            belong: this
        });
        this.model.select(state);
    },

    newLinkView: function(link) {
        var view = new fa.LinkView({
            model: link,
            belong: this
        });
        this.model.select(link);
    },

    setMode: function(e) {
        var el = $(e.currentTarget);
        this.mode = parseInt(el.attr('val'));
        this.$('button[target^="mode"].active').removeClass('active');
        el.addClass('active');
    },

    setStateType: function(e) {
        if (this.model.selected && this.model.selected instanceof fa.State) {
            var el = $(e.currentTarget);
            el.removeClass('active');
            if (el.attr('val') === 'start') {
                // click start button
                this.model.selected.toggleStart();
                this.model.set('start', null);
                if (this.model.selected.get('isStart')){
                    this.model.set('start', this.model.selected.get('name'));
                    el.addClass('active');
                }
            } else {
                // click final button
                this.model.selected.toggleFinal();
                if (this.model.selected.get('isFinal')){
                    el.addClass('active');
                    this.get('final').push(this.model.selected.get('name'));
                }
            }
        }
    },

    setAutomataType: function(e) {
        var el = $(e.currentTarget);
        this.model.set('type', el.attr('val'));
    },

    inputDone: function(e) {
        if (this.model.selected) {
            var el = $(e.currentTarget),
                value = el.val().trim();
            if (value) {
                if (this.model.selected instanceof fa.State) {
                    this.model.selected.set('name', value);
                } else {
                    this.model.selected.set('transition', value);
                }
            }
        }
    },

    onEnter: function(e) {
        if (e.which === 13) {
            this.inputDone(e);
            $(e.currentTarget).blur();
        }
    },

    onSelect: function(model) {
        var $start = $('button[val^="start"]').removeClass('active'),
            $end = $('button[val^="end"]').removeClass('active'),
            $input = this.$('div[domain$="name"] input').val('');
        if (model) {
            model.get('isStart') && $start.addClass('active');
            model.get('isFinal') && $end.addClass('active');
            $input.val(model.get('name') || model.get('transition'));
        }
    }
});