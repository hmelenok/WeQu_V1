Template.signIn.events({
    'submit #signIn': function(event) {
        event.preventDefault();
        Meteor.loginWithPassword(event.target.loginEmail.value, event.target.loginPassword.value, function (err) {
          if(err){
            $('#error').text(err);
          }
        });
    },
    'click #signUp': function (event) {
      Session.set('signUp', true);
    }
});
Template.signIn.helpers({
  signUpShow: function() {
    return Session.get('signUp');
  },
});
