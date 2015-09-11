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

    Template.invite.helpers({
        /*connections : function(){
            return Connections.find({});
        }*/
    });

    Template.quiz.events({
        "click button" : function(){
            Router.go("/invite")
        }
    });

    Template.registerHelper("case", function(){
        var pair =_.chain(this).pairs().first().value();

        var key = pair[0];
        var value = pair[1];

        var pdata = Template.parentData(1);
        _.extend(this, pdata);

        if(pdata && pdata[key] && pdata[key] == value) {
            return Template._case_default;
        }
        var rvar = window[key];
        if(!rvar){
            rvar = window[key] = new ReactiveVar("default");
        }
        if(rvar instanceof ReactiveVar && rvar.get() == value) {
            return Template._case_default;
        }
        return null;
    });

    _.chain(this).pairs().filter(function(pair){
        return (pair[1] instanceof ReactiveVar);
    }).each(function(pair){
        Template.registerHelper(pair[0], function(){
            return pair[1].get();
        });
    });

}
Connections = new Mongo.Collection("connections");

if (Meteor.isServer) {
  Meteor.startup(function () {
      Meteor.publish("connections", function(){
          //make linkedin api call
          if(this.userId) {
              //make api call
              //this.added("connections", 1, {firstName : "Ilya Ovdin"});
          } 
          this.ready();
      });
    // code to run on server at startup
  });
}
