
if (Meteor.isClient) {
    Router.route('/invitation/:_id', function () {
        this.wait(Meteor.subscribe('invitation', this.params._id));
        if(!this.ready()){
            this.render('loading');
            return;
        }
        var feedback = Feedback.findOne({_id : this.params._id});
        if(feedback && feedback.done) {
            Router.go('/')
            return;
        }
        Session.setPersistent('invitation-id', this.params._id);
        if(feedback){
            //var user = Meteor.users.findOne({_id : feedback.from});
            var user = Meteor.user();
            if(user && user.profile && user.profile.pictureUrl) {
                quizPerson.set(feedback.to);
                Router.go('/quiz')
                return;
            }
        }
        Session.setPersistent('invite', 'init');
        Router.go('/script-invitation');
    }, { 'name': '/invitation/:_id' });


    Router.route('/script-invitation', function () {
        this.layout('ScriptLayout');

        var invitationId = Session.get('invitation-id')
        switch(Session.get('invite')) {
            case 'init': {
                this.render("scriptInviteInit")
                return;
            }
            case 'quiz': {
                this.wait(Meteor.subscribe('invitation', invitationId));
                if(!this.ready()){
                    this.render('loading');
                    return;
                }
                var data = { feedback: Feedback.findOne({_id : invitationId}) };
                if(!data.feedback) {
                    this.render("error", {data : { message: "No such invitation " + invitationId}});
                    setTimeout(function(){
                        finishInviteScript();
                    }, 3000)
                    return;
                }
                var user = Meteor.users.findOne({_id : data.feedback.to});
                if(!user) {
                    this.render("error", {data : { message: "No such user"}});
                    setTimeout(function(){
                        finishInviteScript();
                    }, 3000)
                    return;
                }

                data.person = user.profile;
                this.render('quiz', { 'data': data });
                return;
            }
            case 'filldata':{
                this.wait(Meteor.subscribe('invitation', invitationId));
                if(!Meteor.user() || !this.ready()){
                    this.render("loading");
                    return;
                }
                var feedback = Feedback.findOne({_id : invitationId})
                var data = calculateTopWeak([feedback]);
                data.person = Meteor.users.findOne({_id : feedback.to}).profile;

                this.render('scriptInvitationFillData', { data: data });
                return;
            }
        }

        this.render("error", {data : { message: "Unkonwn invitation script state: " + Session.get("invite")}});
        setTimeout(function(){
            finishInviteScript();
        }, 3000)


    }, { 'name': '/script-invitation' });

    function finishInviteScript(){
        if(Session.get('invite')) {
            Session.clear('invite');
        }
        Router.go('/');
    }

    Template.scriptInvitationFillData.onCreated(function(){
        var user = Meteor.user()
        if(user && user.profile && user.profile.firstName && user.profile.pictureUrl) {
            finishInviteScript();
        }
    });

    Template.scriptInvitationFillData.events({
        "click button" : function(){
            Meteor.loginWithLinkedin({});
        }
    });

    Template.scriptInviteInit.onCreated(function () {
        var invitationId = Session.get('invitation-id');
        Meteor.call('inviteLogin', invitationId, function(err, username){
            console.log("invite login result", err, username);
            if(username){
                Meteor.loginWithPassword(username, invitationId);
            }
            Session.setPersistent('invite', 'quiz');
        });
    });
}

if(Meteor.isServer) {
    Meteor.methods({
        /* "getMergeToken" : function(){
            if(!Meteor.userId()) {
                throw new Meteor.Error("not_logged_in");
            }

            var token = Random.secret();
            Meteor.users.update({_id : Meteor.userId}, {$set : { "services.merge.token" : token }});
            return token;
        },*/
        "mergeAccounts" : function(invitationId){
            if(!Meteor.userId()) {
                throw new Meteor.Error("not_logged_in");
            }
            var oldUser = Meteor.users.findOne({"services.invitationId": invitationId});
            if(!oldUser){
                throw new Meteor.Error("invalid_token");
            }
            var curUser = _.clone(Meteor.user())
            console.log("mergeAccounts", oldUser._id, curUser._id);
            Feedback.update({from: oldUser._id}, {$set : { from : curUser._id}}, {multi : true});
            Feedback.update({to: oldUser._id}, {$set : { to : curUser._id}}, {multi : true});
            Meteor.users.remove({ _id: oldUser._id });
        }
    });
    Meteor.startup(function () {
        Meteor.publish('invitation', function (id) {
            var fb = Feedback.findOne(id);
            if(!fb) { return [] }
            return [
                Feedback.find(id),
                Meteor.users.find({ '_id': fb.to }, { 'fields': { 'profile': 1 } })
            ];
        });
    });
}
