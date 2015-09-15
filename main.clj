
;(Router.route "/test" (fn [] (this.render :loading)))


(defmacro comment [& operations]
  nil)

; shortcuts
(comment
  (on-client 
    (console.log "hello world")
    (console.log "hello world2"))

  ;translates to
  (if Meteor.isClient
    (do
      (console.log "hello world")
      (console.log "hello world2")))

  (on-server
    (console.log "hello world")))

(defmacro on-client [& body]
  `(if Meteor.isClient
     (do ~@body)))

(defmacro on-server [& body]
  `(if Meteor.isServer
     (do ~@body)))


(comment 
  (route "/invite"
         (this.wait (Meteor.subscribe :connections))
         (this.render :invite))

  ;translates to
  (Router.route "/invite"
                (fn []
                  (this.wait (Meteor.subscribe :connections))
                  (this.render :invite))))


(defmacro route [path & body]
  `(Router.route ~path
                (fn [] ~@body)))


(Router.configure { layoutTemplate :ApplicationLayout})

(Router.on-before-action 
  (fn []
    (if (Meteor.userId)
      (this.next)
      (this.render :login))))

(route "/"
       (Router.go "/quiz"))

(route "/feed"
       (this.render :feed))

(route "/profile"
       (this.render :profile { :data (fn [] (Meteor.user))}))

(route "/profile/skills"
       (this.render :profileSkills { :data (fn [] (Meteor.user))}))

(route "/profile/writtenFeedback"
       (this.render :profileWrittenFeedback { :data (fn [] (Meteor.user))}))

(comment
  (defm-event :invite "click button" [event template]
    (conosle.log "hello world"))
  ;translates to
  (Template.invite.events 
    { "click button" (fn [event template]
                       (console.log "hello world"))})


  (defm-helper :invite :test [])
  (Template.invite.helpers { "test" (fn [] )}))

(defmacro defm-event [template event & body]
  `(.events (get Template ~template) 
            (let [h {}] 
              (set! (get h ~event) (fn ~@body)) 
              h)))

(defmacro defm-helper [template name & body]
  `(.helpers (get Template ~template) 
            (let [h {}] 
              (set! (get h ~name) (fn ~@body)) 
              h)))
(on-client
  (route "/invite"
         (this.wait (Meteor.subscribe :connections))
         (if (this.ready)
           (this.render :invite)
           (this.render :loading)))

  (def invite-status (new ReactiveVar :default))

  (defm-event :invite "click button" [event template]
    (invite-status.set :sending)
    (def email (.val (template.$ "input[name=email]")))

    (Meteor.call :invite email 
                 (fn [err result]
                   (if err
                     (invite-status.set :error)
                     (do 
                       (invite-status.set :sent)
                       (set-interval (fn [] (invite-status.set :default)) 1000)))
                   (console.log err result))))
  )

(comment
  (defm-server-method :invite [email]
    email)
  ;translates to
  (on-server
    (Meteor.methods
      { :invite 
       (fn [email]
         email
         )}))

  ;TODO
  (on-client
    (defn invite [email] callback
      (Meteor.call :invite email callback))))

(defmacro defm-server-method [name & body] 
  `(do
     (on-server
       (Meteor.methods (let [h {}] 
                         (set! (get h ~name) (fn ~@body)) 
                         h)))))

(def Invitation (new Mongo.Collection "invitation"))

(defm-server-method :invite [email]
  (check (Meteor.userId) String)
  ;TODO validate email
  (def template (_.template (Assets.getText "emails/invite.txt")))
  (def profile (.-profile (Meteor.user)))
  (def record { :from (Meteor.userId) :to email})
  (Invitation.upsert record record)
  (set! record (Invitation.findOne record))
  (Email.send 
    { :to email 
     :from "delivery@wequo.com"
     :subject "please evaluate my skills"
     :text (template {:from (+ profile.first-name " " profile.last-name)
                      :link (Meteor.absoluteUrl (+ "evaluate/" record._id)) })
     });
  email)


(route "/evaluate/:id"
       (this.wait (Meteor.subscribe :connections))
       (this.render :evaluate))

(def Answers (new Mongo.Collection "answers"))

; import questions

(on-client
  (route "/admin"
         (this.render "admin"))

  (defm-event :admin "click button" []
    (Meteor.call :import)))

(defm-server-method :import []
  (def qs (Assets.getText "questions.csv"))
  (Answers.remove {})
  (def lines (qs.split "\r\n"))
  (loop [i 0]
    (if (< i lines.length)
      (do
        (def l (.split (get lines i) ","))
        (def q { :_id (String i)
                :category (get l 0) 
                :skill (get l 1) 
                :text (get l 2)
                })
        (Answers.insert q)
        (recur (+ i 1))))))

  
(comment
  (publish :answers []
           (Answers.find {})))

(defmacro publish [name & body]
  `(on-server
     (Meteor.startup
       (fn []
         (Meteor.publish 
           ~name 
           (fn ~@body))))))

(publish :answers []
           (Answers.find {}))

(on-client
  (def quizzy (_.template "What is more true about <%= name %>?"))

  (route "/quiz"
         (this.wait (Meteor.subscribe :answers))
         (if (this.ready)
           (this.render :quiz  {:data {:answers (_.shuffle (.fetch (Answers.find {})))
                                       :answered 0}} )
           (this.render :loading)))

  (route "/quiz-finished" 
         (this.render :quiz-finished))

  (defm-event :quiz-finished "click button" []
    (Router.go "/invite"))

  (defm-helper :quiz :person []
    (.-profile (Meteor.user)))

  (defm-helper :quiz :question []
    (def profile (.-profile (Meteor.user)))
    (quizzy {:name (+ profile.first-name " " profile.last-name)}))

  (def answerDep (new Tracker.Dependency))
  (defm-helper :quiz :answers []
    (answerDep.depend)
    (def result (_.first this.answers 2))
    (set! this.answers (_.rest this.answers 2))
    result)

  (defm-event :quiz "click .answer" [event]
    (Meteor.call :answer (event.target.getAttribute "id") (Meteor.userId)
                 (fn [err result]
                   ;TODO show error
                   (set! this.answered (+ 1 (or this.answered 0)))
                   (if (> this.answered 5)
                     (Router.go "/quiz-finished")
                     (answerDep.changed))))
    )

  (defm-event :quiz "click .skip" []
    (answerDep.changed))
  )

(def Feedback (new Mongo.Collection "feedback"))

(defm-server-method :answer [id person]
  (def answer (Answers.findOne id))
  (Feedback.insert {:answer id :category answer.category :skill answer.skill :person person :from (Meteor.userId)})
  0)
