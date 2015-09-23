if(Meteor.isClient) {
    Router.route('/invite', function () {
        route.set('invite');
        this.wait(Meteor.subscribe('connections'));
        this.ready() ? this.render('invite') : this.render('loading');
    }, { 'name': '/invite' });

    inviteStatus = new ReactiveVar('default');
    Template.invite.events( { "click button" : function (event, template) {
        inviteStatus.set('sending');
        var email = template.$('input[name=email]').val();
        Meteor.call('invite', email, function (err, result) {
            if(err){
                inviteStatus.set('error');
                return;
            }
            setInterval(function () {
                return inviteStatus.set('default');
            }, 1000);
            console.log(err, result);
        });
    }})
}
if(Meteor.isServer)  {
    Meteor.methods({
        'invite' : function (email) {
            check(Meteor.userId(), String);
            var profile = Meteor.user().profile;
            var name = profile.firstName + ' ' + profile.lastName;
            qset = genQuestionSet(name, Answers.find({}).fetch());
            Feedback.upsert({
                'from': email,
                'to': Meteor.userId()
            }, {
                'from': email,
                'to': Meteor.userId(),
                'qset': qset
            });
            var rec = Feedback.findOne({
                'from': email,
                'to': Meteor.userId()
            });
            console.log('rec', rec);
            var template = _.template(Assets.getText('emails/invite.txt'));
            Email.send({
                'to': email,
                'from': 'support@wequ.co',
                'subject': 'please evaluate my skills',
                'text': template({
                    'from': name,
                    'link': Meteor.absoluteUrl('invitation/' + rec._id)
                })
            });
            return email;
        }
    })
}
