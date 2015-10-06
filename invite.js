if(Meteor.isClient) {
    Router.route('/invite', function () {
        route.set('invite');
        this.wait(Meteor.subscribe('feedback'));
        if (!this.ready()){
            this.render('loading');
            return;
        }

        var users = Feedback.find({ $or : [ {to: Meteor.userId()}, {from: Meteor.userId()} ]} ).map(function(fb){ return fb.from });

        this.render('invite', {data : { users : Meteor.users.find({_id : {$in : users}}, {profile : 1}) }})
    }, { 'name': '/invite' });

    inviteStatus = new ReactiveVar('default');
    Template.invite.events( { "click button" : function (event, template) {
        inviteStatus.set('sending');
        var email = template.$('input[name=email]').val();
        var name = template.$('input[name=name]').val();
        Meteor.call('invite', name, email, function (err, userId) {
            if(err){
                console.log("error", err);
                inviteStatus.set('error');
                return;
            } 

            template.$('input[name=name]').val('')
            template.$('input[name=email]').val('');
            inviteStatus.set('sent');

            setInterval(function () {
                return inviteStatus.set('default');
            }, 3000);
            if(getLoginScript()){
                quizPerson.set(userId);
                return setLoginScript('finish');
            }
            console.log(err, userId);
        });
    }})
}
if(Meteor.isServer)  {
    Meteor.methods({
        'inviteLogin' : function(token){
           var feedback = Feedback.findOne({_id : token}) 
           if(!feedback) return;
           if(feedback.done) return;
           var user = Meteor.users.findOne({_id : feedback.from});
           if(!user) return;
           return user.username;
           //TODO: change password to login only once with token
           //TODO: update email verified
        },
        'invite' : function (toName, email) {
            check(Meteor.userId(), String);
            if(!toName){
                throw (new Meteor.Error("empty_name"));
            }

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
                    profile : { emailAddress : email, name: toName}
                });
            } else {
                userId = user._id;
            }

            var feedback = Feedback.findOne({ 'from': userId, 'to': Meteor.userId() });

            var fbId = Feedback.insert({_id: _id, from : userId, to: Meteor.userId(), qset : qset, invite : true, done: false });

            if(!user){
                Meteor.users.update({_id: userId}, {$set : { "services.invitationId": _id}});
            }

            var template = _.template(Assets.getText('emails/invite.txt'));
            Email.send({
                'to': email,
                'from': 'WeQu <info@wequ.co>',
                'subject': _.template("[to], let your opinion matter to [from]!")({ to: toName, from:name }),
                'text': template({
                    'from': name,
                    'to' : toName,
                    'link': Meteor.absoluteUrl('invitation/' + _id)
                })
            });
            return userId;
        }
    })
}
