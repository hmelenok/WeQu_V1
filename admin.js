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
            Meteor.call("reset", function(err, result){
                Router.go('/');
            })
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

    qdata = { type1you : [], type1others : [], type3 : [] };
    splitLine = function splitLine(line){
        return line.split(",").map(function(el){
            if(el.charAt(0) == '\"'){
                return el.substr(1, el.length - 2);
            }
            return el;
        })
    }

    importQuestions = function importQuestions() {
        var qs = Assets.getText('questionset - type1you.csv');
        var lines = Papa.parse(qs).data;
        var i; 
        for (i = 1; i < lines.length; i++) {
            var l =  lines[i];
            qdata.type1you.push({_id: String(i), skill: l[0], text: l[1]});
        }

        qs = Assets.getText('questionset - type1others.csv');
        lines = Papa.parse(qs).data;
        for (i = 1; i < lines.length; i++) {
            var l =  lines[i];
            qdata.type1others.push({_id: String(i), skill: l[0], text: l[1]});
        }
        qs = Assets.getText('questionset - type3.csv');
        lines = Papa.parse(qs).data;
        var question;
        for (i = 1; i < lines.length; i++) {
            var l =  lines[i];
            if(l[0]) {
                qdata.type3.push(question);
                question = { text : l[0], answers : [ {_id: String(i), text: l[1], skill: l[2]} ] };
            } else if(question){
                question.answers.push({_id: String(i), text: l[1], skill: l[2]});
            } 
        }
        qdata.type3.push(question);
    };

    Meteor.startup(function () {
        importQuestions();
    });

    Meteor.methods({ 
        import : importQuestions,
        reset : function(){
            if(Meteor.userId()) {
                //Feedback.remove({from : Meteor.userId()});
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
