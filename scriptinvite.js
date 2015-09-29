
if (Meteor.isClient) {
    Router.route('/invitation/:_id', function () {
        Session.setPersistent('invite', 'init');
        Session.setPersistent('invitation-id', this.params._id);
        Router.go('/script-invitation');
    }, { 'name': '/invitation/:_id' });


    Router.route('/script-invitation', function () {
        this.layout('ScriptLayout');

        switch(Session.get('invite')) {
            case 'init': {
                this.render("scriptInviteInit")
                return;
            }
            case 'quiz': {
                var invitationId = Session.get('invitation-id')
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
                this.render('scriptInvitationFillData');
                return;
            }

            case 'finish' : {
                this.render('scriptInvitationFinish')
                return;
            }
        }

        Session.setPersistent('invite', false);
        Session.clear('invitation-id');
        Router.go("/");

    }, { 'name': '/script-invitation' });

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
