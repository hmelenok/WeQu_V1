Template.signUp.events({
  'submit form': function(event){
     event.preventDefault();
     Accounts.createUser({
            email: event.target.registerEmail.value,
            password: event.target.registerPassword.value
        }, function (err) {
          if(err){
            $('#error').text(err);
          }});
    }
    });
