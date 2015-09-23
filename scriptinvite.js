
if (Meteor.isClient) {
    Router.route('/invitation/:_id', function () {
        Session.setPersistent('invite', 'quiz');
        Session.setPersistent('invitation-id', this.params._id);
        Router.go('/script-invitation');
    }, { 'name': '/invitation/:_id' });


    Router.route('/script-invitation', function () {
        this.layout('ScriptLayout');
        switch(Session.get('invite')) {
            case 'quiz': {
                Meteor.subscribe('invitation', Session.get('invitation-id'));
                if(this.ready() && Feedback.findOne({})){
                    this.render('quiz', {
                        'data': {
                            'feedback': Feedback.findOne({}),
                            'person': Meteor.users.findOne({})
                        }
                    })
                } else {
                    this.render('loading');
                }  
                break;
            }

            case 'finish' : {
                this.render('scriptInvitationFinish')
                break;
            }
        }

    }, { 'name': '/script-invitation' });

    Template['scriptInvitationFinish'].events({
        "click .next" : function () {
            Session.setPersistent('invite', false);
            Session.clear('invitation-id');
            return Router.go('/');
        }
    });
}

if(Meteor.isServer) {
    Meteor.startup(function () {
        Meteor.publish('invitation', function (id) {
            var fb = Feedback.findOne(id);
            return [
                Feedback.find(id),
                Meteor.users.find({ '_id': fb.to }, { 'fields': { 'profile': 1 } })
            ];
        });
    });
}
