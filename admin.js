if (Meteor.isClient) {
    Router.route('/admin', function () {
        return this.render('admin');
    }, { 'name': '/admin' });

    //TODO: admin auth

    Template['admin'].events({
        "click #import" : function () {
            Meteor.call('import');
        },
        'click #reset' : function () {
            setLoginScript('init');
            Meteor.call("reset")
        },
        'click #logout' : function(){
            Meteor.logout();
            Router.go("/");
        },
        'click #login' : function(){
            Meteor.call("loginTestUser", function(err, result){
                console.log("loginTestUser", err, result);
                Meteor.loginWithPassword(result, result, function(err, result){
                    console.log("loginWithPassword", err, result)
                });
            });
        } 
    });
}

if(Meteor.isServer) {
    importQuestions = function importQuestions() {
        var qs = Assets.getText('questions.csv');
        Answers.remove({});
        Feedback.remove({});
        var lines = qs.split('\r\n');
        return function loop() {
            var recur = loop;
            var iø1 = 0;
            do {
                recur = iø1 < lines.length ? (function () {
                    var l = lines[iø1].split(',');
                    var q = {
                        '_id': String(iø1),
                        'category': l[0],
                        'skill': l[1],
                        'text': l[2]
                    };
                    Answers.insert(q);
                    return loop[0] = iø1 + 1, loop;
                })() : void 0;
            } while (iø1 = loop[0], recur === loop);
            return recur;
        }.call(this);
    };
    Meteor.startup(function () {
        return !Answers.findOne({}) ? importQuestions() : void 0;
    });

    Meteor.methods({ 
        import : importQuestions,
        reset : function(){
            if(Meteor.userId()) {
                Feedback.remove({from : Meteor.userId()});
                Feedback.remove({to : Meteor.userId()});
                Meteor.users.remove({_id : Meteor.userId()});
            }
        },
        loginTestUser : function(){
            var username = "test" + Math.round(Math.random() * 10000000);
            Accounts.createUser({ 
                username: username, 
                                email: username + "@email.test", 
                                password: username, 
                                profile: { firstName : username, lastName : ""}});
            return username;

        }
    })
}
