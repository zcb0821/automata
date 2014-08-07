var automata = angular.module("automata", ['ngRoute']);

automata.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});

automata.config(function($routeProvider){
    $routeProvider
        .when('/', {
            redirectTo: '/finite_automata'
        })
        .when('/finite_automata', {
            templateUrl: 'static/partials/finite_automata.html'
        })
        .when('/regular', {
            templateUrl: 'static/partials/regular.html'
        })
        .when('/grammar', {
            templateUrl: 'static/partials/grammar.html'
        })
        .when('/pda', {
            templateUrl: 'static/partials/pda.html'
        })
        .when('/turing_machine', {
            templateUrl: 'static/partials/turing_machine.html'
        })

});

automata.controller('top-nav', function($scope){
    $scope.items = [{
            url: '#/finite_automata',
            title: '有穷自动机'
        },{
            url: '#/regular',
            title: '正则表达式'
        },{
            url: '#/grammar',
            title: '上下文无关文法'
        },{
            url: '#/pda',
            title: '下推自动机'
        },{
            url: '#/turing_machine',
            title: '图灵机'
        }];
    $scope.activeItem = $scope.items[0].title;
    $scope.onNavItemClick = function(title){
        $scope.activeItem = title;
    }
});

automata.controller('finiteAutomataCtrl', function($scope){
    $scope.items = {
        accept: {
            title: '输入判断'
        },
        minimize: {
            title: 'DFA最小化',
            button: true
        },
        NFAtoDFA: {
            title: 'NFA转DFA',
            button: true
        },
        toRegular: {
            title: '转正则表示式'
        }
    }
    $scope.activeItem = $scope.items.accept.title;
    $scope.onNavItemClick = function(title){
        if ($scope.oriFA.get('type') === "DFA" && title === $scope.items.NFAtoDFA.title ||
            $scope.oriFA.get('type') === "NFA" && title === $scope.items.minimize.title)
            return;
        $scope.activeItem = title;
    }
    $scope.oriFA= new fa.Automata();
    $scope.oriFAView = new fa.AutomataView({
        model: $scope.oriFA,
        element: '#fa-input'
    });

    $scope.minFA = new fa.Automata();
    $scope.minFAView = new fa.AutomataView({
        model: $scope.minFA,
        element: '#minimize-dfa'
    });

    $scope.DFA = new fa.Automata();
    $scope.DFAView = new fa.AutomataView({
        model: $scope.DFA,
        element: '#nfa-to-dfa'
    });

    $scope.check_status = "输入";
    $scope.check = function(input_string){
        var x = {};
        x.data = $scope.DFA.toJSON();
        x.input_string = input_string;
        $http.post('/finite/check/', x).success(function(response){
            response = JSON.parse(response);
            if (response.error){
                alert(response.error);
            } else {
                $scope.check_status = response.data;
            }
        });
    }

    $scope.start = function(){
        var data = $scope.oriFA.toJOSN();
        if ($scope.activeItem === $scope.items.NFAtoDFA.title) {
            $http.post('/finite/nfatodfa/', data).success(function(response){
                response = JSON.parse(response);
                if (response.error){
                    alert(response.error);
                } else {
                    //todo
                }
            });
        } else if ($scope.activeItem === $scope.items.minimize.title){
            $http.post('/finite/minimize/', data).success(function(response){
                response = JSON.parse(response);
                if (response.error){
                    alert(response.error);
                } else {
                    $scope.regularExpression = response.data;
                }
            });
        }

    }

    $scope.convertToRegular = function(){
        var data = $scope.oriFA.toJOSN();
        $http.post('/finite/converttoregular/', data).success(function(response){
            response = JSON.parse(response);
            if (response.error){
                alert(response.error);
            } else {
                //todo
            }
        });
    }
});

automata.controller('regular', function($scope, $http){
    $scope.items = {
        accept: {
            title: '输入判断'
        },
        toDFA: {
            title: '正则表达式转DFA'
        }
    }
    $scope.activeItem = $scope.items.accept.title;
    $scope.onNavItemClick = function(title){
        $scope.activeItem = title;
    }
    $scope.DFA = new fa.Automata();
    $scope.DFAView = new fa.AutomataView({
        model: $scope.DFA,
        height: 360,
        element: '#regular-to-dfa'
    });

    $scope.check = function(testString){
        var re = eval('/^' + $scope.regularExpr + '$/g');
        if (testString.match(re)){
            $scope.checkResult = "接受";
        } else {
            $scope.checkResult = "不接受";
        }
    }

    $scope.checkResult = "输入";
    $scope.start = function(){
        $http.post('/regular/convertodfa/', data).success(function(response){
            response = JSON.parse(response);
            if (response.error){
                alert(response.error);
            } else {
                //todo
            }
        });
    }
});

automata.controller('grammarCtrl', function($scope, $http){
    $scope.items = {
        grammarAcceptTest: {
            title: '输入判断'
        },
        grammarToPDA: {
            title: '转PFA'
        },
        grammarSimplify: {
            title: '文法化简'
        }
    }
    $scope.check_status = "输入";
    $scope.activeItem = $scope.items.grammarAcceptTest.title;
    $scope.onNavItemClick = function(title){
        $scope.activeItem = title;
    }
    $scope.PFA = new fa.Automata();
    $scope.PFAView = new fa.AutomataView({
        model: $scope.PFA,
        element: '#grammar-to-pda',
        type: ['PDA']
    });

    $scope.productions = [];

    $scope.s_productions = [];

    $scope.add = function(){
        $scope.productions.push({
            head: "",
            body: ""
        })
    }

    $scope.remove = function(item){
        $scope.productions = _.without($scope.productions, item);
    }

    $scope.check = function(input_string){
        var x = {};
        x.data = $scope.productions;
        x.input_string = input_string;
        $http.post('/grammar/check/', x).success(function(response){
            response = JSON.parse(response);
            if (response.error){
                alert(response.error);
            } else {
                $scope.check_status = response.data;
            }
        });
    }


});

automata.controller('pdaCtrl', function($scope){
    $scope.items = {
        acceptTest: {
            title: '输入判断'
        },
        toGrammar: {
            title: '转上下文无关文法'
        }
    }
    $scope.activeItem = $scope.items.acceptTest.title;
    $scope.onNavItemClick = function(title){
        $scope.activeItem = title;
    }
    $scope.PDA = new fa.Automata();
    $scope.PDAView = new fa.AutomataView({
        model: $scope.PDA,
        element: '#pda-input',
        type: ['PDA']
    });
});