if(Meteor.isClient) {
    Router.route('/invite', function () {
        route.set('invite');
        this.wait(Meteor.subscribe('feedback'));
        if (!this.ready()){
            this.render('loading');
            return;
        }

        var users = Feedback.find({to: Meteor.userId(), invite: true }).map(function(fb){ return fb.from });

        this.render('invite', {data : { users : Meteor.users.find({_id : {$in : users}}, {profile : 1}) }})
    }, { 'name': '/invite' });

    inviteStatus = new ReactiveVar('default');
    Template.invite.events( { "click button" : function (event, template) {
        inviteStatus.set('sending');
        var email = template.$('input[name=email]').val();
        Meteor.call('invite', email, function (err, result) {
            if(err){
                console.log("error", err);
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
        'inviteLogin' : function(token){
           var feedback = Feedback.findOne({_id : token}) 
           console.log("feedback", !!feedback);
           if(!feedback) return;
           var user = Meteor.users.findOne({_id : feedback.from});
           console.log("user", !!user);
           if(!user) return;
           return user.username;
           //TODO: change password to login only once with token
           //TODO: update email verified
        },
        'invite' : function (email) {
            check(Meteor.userId(), String);
            if(!validateEmail(email)) {
                throw (new Meteor.Error("invalid_email"));
            }
            var profile = Meteor.user().profile;
            var name = getUserName(profile);
            qset = genInitialQuestionSet(name, qdata.type1others, 10);
            var user = Meteor.users.findOne({$or : [ {"emails.address" : email }, { "profile.emailAddress" : email }]});
            var _id = Random.secret()
            var userId;
            if(! user){
                userId = Accounts.createUser({ 
                    username: Random.id(), 
                    email: email, 
                    password: _id,
                    profile : { emailAddress : email }
                });
            } else {
                userId = user._id;
            }

            var feedback = Feedback.findOne({ 'from': userId, 'to': Meteor.userId() });
            if(feedback){
                return;
            }

            Feedback.insert({_id: _id, from : userId, to: Meteor.userId(), qset : qset, invite : true });

            var template = _.template(Assets.getText('emails/invite.txt'));
            Email.send({
                'to': email,
                'from': 'support@wequ.co',
                'subject': 'please evaluate my skills',
                'text': template({
                    'from': name,
                    'link': Meteor.absoluteUrl('invitation/' + _id)
                })
            });
            return email;
        }
    })
}
