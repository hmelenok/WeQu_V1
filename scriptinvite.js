
if (Meteor.isClient) {
    Router.route('/invitation/:_id', function () {
        Session.setPersistent('invite', 'init');
        Session.setPersistent('invitation-id', this.params._id);
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
                if(!data.feedback) break;
                var user = Meteor.users.findOne({_id : data.feedback.to});
                if(!user) break;
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
                var fb =  Feedback.findOne({_id : invitationId});
                var score = calculateScore(fb.qset);
                var keys = _.sortBy(_.difference(_.keys(score), _.keys(framework)), function(key) { return score[key] })
                var top3 = _.map(_.last(keys, 3), function(skill){ return { skill: skill, text: i18n[skill] } });

                var user = Meteor.users.findOne({_id : fb.to});
                this.render('scriptInvitationFillData', { data: { top3: top3, person: user.profile } });
                return;
            }

            case 'finish' : {
                this.render('scriptInvitationFinish')
                return;
            }
        }

        Session.setPersistent('invite', false);
        if(Session.get("invitation-id"))
            Session.clear('invitation-id');
        Router.go("/");

    }, { 'name': '/script-invitation' });

    Accounts.onLogin(function(){
        var token = Session.get("mergeToken");
        var invitationId = Session.get('invitation-id');
        if(!token || !invitationId) {
            return;
        }
        if(token) Session.clear("mergeToken")
        Meteor.call("mergeAccounts", token, function(err, result){
            if(err){
                return;
            }
            Session.setPersistent('invite', "finish");
        });
    });

    Accounts.onLoginFailure(function(){
        var token = Session.get("mergeToken");
        if(token){
            Session.clear("mergeToken");
        }
    });

    Template.scriptInvitationFillData.onCreated(function(){
        var user = Meteor.user()
        if(user && user.profile && user.profile.firstName && user.profile.pictureUrl) {
            Session.setPersistent('invite', "finish");
        }
    });

    Template.scriptInvitationFillData.events({
        "click button" : function(){
            Meteor.call("getMergeToken", function(err, token){
                console.log("getMergeToken", err, token);
                if(err){
                    return;
                }
                Session.setPersistent("mergeToken", token)
                Meteor.loginWithLinkedin({});
            });
        }
    });

    Template['scriptInvitationFinish'].events({
        "click button" : function () {
            Session.setPersistent('invite', false);
            Session.clear('invitation-id');
            return Router.go('/');
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
        "getMergeToken" : function(){
            if(!Meteor.userId()) {
                throw new Meteor.Error("not_logged_in");
            }

            var token = Random.secret();
            Meteor.users.update({_id : Meteor.userId}, {$set : { "services.merge.token" : token }});
            return token;
        },
        "mergeAccounts" : function(token){
            if(!Meteor.userId()) {
                throw new Meteor.Error("not_logged_in");
            }
            var oldUser = Meteor.users.findOne({"services.merge.token" : token});
            if(!oldUser){
                throw new Meteor.Error("invalid_token");
            }
            var curUser = _.clone(Meteor.user())
            Feedback.update({from: oldUser._id}, {$set : { from : curUser._id}});
            Feedback.update({to: oldUser._id}, {$set : { to : curUser._id}});
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
