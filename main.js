if (Meteor.isClient) {

    Router.onBeforeAction(function () {
        if (!Meteor.userId()) {
            this.render('login');
        } else {
            this.next();
        }
    });

    Router.route('/', function(){
        this.render("quiz");
    });

    Router.route('/profile', function(){
        this.render("profile", {data : function(){
            return Meteor.user();
        }});
    });

    Router.route('/quiz', function(){
        this.render("quiz");
    });
    Router.route('/invite', function(){
        this.wait(Meteor.subscribe('connections'));
        if (this.ready()) {
            this.render("invite");
        } else {
            this.render('loading');
        }
    });

    Template.quiz.events({
        "click button" : function(){
            Router.go("/invite")
        }
    });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
      Meteor.publish("connections", function(){
          if(!this.userId) {

          } 
          //[{firstName : "Ilya Ovdin"}]
          this.ready();

      });
    // code to run on server at startup
  });
}
