if (Meteor.isClient) {
    Router.route('/admin', function () {
        return this.render('admin');
    }, { 'name': '/admin' });

    Template['admin'].events({
        "click #import" : function () {
            return Meteor.call('import');
        },
        'click #reset' : function () {
            return setLoginScript('init');
        },
        'click #logout' : function(){
            Meteor.logout();
            Router.go("/");
        }
    })
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

    Meteor.methods({ import : function(){
        importQuestions();
    }})
}
