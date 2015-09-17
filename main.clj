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
                (fn [] ~@body) {:name ~path}))


(Router.configure { layoutTemplate :ApplicationLayout})

(Router.on-before-action 
  (fn []
    (if (Meteor.userId)
      (this.next)
      (this.render :login))))

(Router.on-before-action 
  (fn []
    (if (Meteor.user)
      (do
        (def profile (.-profile (Meteor.user)))
        (if (not profile.script)
          (set! profile.script [:login :init]))

        (if (== (aget profile.script 0) :login)
          (Router.go "/script-login"))
        ))
    (this.next)
    ) { :except ["/script-login" "/admin"]})

;TODO why except does not work?

(route "/"
       (Router.go "/profile"))

(route "/feed"
       (this.render :feed))

;TODO
(route "/profile"
       (this.wait (Meteor.subscribe :feedback))
       (if (and (this.ready) (Feedback.find-one {:from (Meteor.user-id)}))
         (this.render :profile { :data { :myfeedback (Feedback.find-one {:from (Meteor.user-id)})
                                        :profile (get (Meteor.user) :profile)
                                        }})
         (this.render :loading)
         ))

(route "/profile/skills"
       (this.render :profileSkills { :data (fn [] (Meteor.user))}))

(route "/profile/written-feedback"
       (this.render :profileWrittenFeedback { :data (fn [] (Meteor.user))}))

(comment
  (defm-event :invite (click :#invite) [event template]
    (conosle.log "hello world"))
  ;translates to
  (Template.invite.events 
    { "click button" (fn [event template]
                       (console.log "hello world"))})


  (defm-helper :invite :test [])
  (Template.invite.helpers { "test" (fn [] )}))

(defmacro defm-event [template event & body]
  `(.events (aget Template ~template) 
            (let [h {}] 
              (set! (aget h ~event) (fn ~@body)) 
              h)))

(defmacro defm-helper [template name & body]
  `(.helpers (aget Template ~template) 
            (let [h {}] 
              (set! (aget h ~name) (fn ~@body)) 
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
                         (set! (aget h ~name) (fn ~@body)) 
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

  (defm-event :admin "click #import" []
    (Meteor.call :import))

  (defm-event :admin "click #reset" []
    (set-script [:login :init])))


(defm-server-method :import []
  (def qs (Assets.getText "questions.csv"))
  (Answers.remove {})
  (Feedback.remove {})
  (def lines (qs.split "\r\n"))
  (loop [i 0]
    (if (< i lines.length)
      (do
        (def l (.split (aget lines i) ","))
        (def q { :_id (String i)
                :category (aget l 0) 
                :skill (aget l 1) 
                :text (aget l 2)
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

(on-client
  (route "/quiz"
         (this.wait (Meteor.subscribe :answers))
         (if (this.ready)
           (this.render :quiz  {:data {:answers (_.shuffle (.fetch (Answers.find {})))
                                       :answered 0}} )
           (this.render :loading)))

  ;TODO
  (defm-helper :quiz :person []
    (.-profile (Meteor.user)))

  (def questionDep (new Tracker.Dependency))

  ;question.answer = false // skip
  ;question.answer = 2
  ;question.answer = undefined
  (defn current-question [questions]
    (questionDep.depend)
    (_.find questions 
            (fn [question]
              (or (not (_.has question :answer)) (not (_.has question :written))))))

  (defm-helper :quiz :writtenFeedback []
    (def question (current-question this.feedback.qset))
    (and (not (== this.feedback.to this.feedback.from)) question (_.has question :answer) (not (_.has question :written))))

  (defm-helper :quiz :self []
    (== this.feedback.from this.feedback.to))

  (defm-helper :quiz :question []
    (current-question this.feedback.qset))

  (defm-event :quiz "click .answer, touch .answer, click .skip, touch .skip, click .writeAnswer, touch .writeAnswer" [event template]
    (def feedback template.data.feedback)
    (def question (current-question feedback.qset))

    (def button-type (event.target.get-attribute :class))

    (if (== button-type :answer)
      (do
        (set! question.answer (event.target.get-attribute :id))
        (if (== feedback.to feedback.from)
          (set! question.written false))))

    (if (== button-type :skip)
      (if (_.has question :answer)
        (set! question.written false)
        (set! question.answer false)))


    (if (== button-type :writeAnswer)
      (do
        (set! question.written (.val (template.$ "textarea")))))

    (Meteor.call :feedback feedback._id feedback.qset
                 (fn [err result]
                   (print :feedback err result)
                   (if (current-question feedback.qset)
                     (questionDep.changed)
                     (if (in-script)
                       (Meteor.call :feedback-result feedback._id 
                                    (fn [err result]
                                      (print :feedback-result err result)
                                      (set-script [:login :after-quiz])))))))))

(def Feedback (new Mongo.Collection "feedback"))

(defm-server-method :feedback [id qset]
  (check (Meteor.user-id) String)
  (Feedback.update {:from (Meteor.user-id) :_id id} { :$set { :qset qset }}))

(comment on-client 
  (Meteor.startup (fn [] (Meteor.call :feedback-result :kcMBQRcEoExefwLpq))))

(defm-server-method :feedback-result [id]
  (check (Meteor.user-id) String)
  (def feedback (Feedback.find-one {:from (Meteor.user-id) :_id id}))
  (def score (_.clone initial-score)) 
  (_.each feedback.qset 
          (fn [question]
            (def answer (_.find question.answers (fn [answer] (== question.answer answer._id))))
            (print :answer answer)
            (inc (get score answer.category))
            (inc (get score answer.skill))
            ;TODO put written feedback into
            ))
  (print :feedback-result score)
  (Feedback.update {:from (Meteor.user-id) :_id id} {:$set {:score score}})
  )

(defmacro ->
  [& operations]
  (reduce
    (fn [form operation]
      (cons (first operation)
            (cons form (rest operation))))
    (first operations)
    (rest operations)))


(def framework 
  {
   :value [ :business_focused :people_focused :intergity :trustful :authenticity ]
   :problem_solving  [ :problem_analysis :creative :conceptual_thinking :manage_conflict :negotiation ]
   :self_mgmt [:self_learning :efficient :initiative :stress_tolerance :persistence ]
   :team_work [:assertive :positive :accept_critics :respectful :facilitation ]
   :leadership [ :strategic :delegation :coaching :committed :empathy ]
   :communication [ :listening :presentation :story_telling :written_communication :sociability ]
   })

(defmacro inc [sym]
  `(set! ~sym (+ 1 ~sym)))

(defn gen-question-set [name answers]
  (def quizzy (_.template "What is more true about <%= name %>?"))
  (def question-text (quizzy {:name name}))
  ;TODO
  (def answers (_.shuffle answers))
  (def question-set [])
  (loop []
    (if (and (> answers.length 2) (< question-set.length 30))
      (do
        (question-set.push {:text question-text :answers [(answers.pop) (answers.pop)]})
        (recur))))
  question-set)

(defm-server-method :gen-question-set [userId]
  (check (Meteor.userId) String)
  (def profile (.-profile (Meteor.user)))
  (def name 
    (if (== userId (Meteor.userId))
      "you"
      (+ profile.firstName " " profile.lastName)))
  (set! qset (gen-question-set name (.fetch (Answers.find {}))))
  (Feedback.upsert {:from (Meteor.userId) :to userId} {:from (Meteor.userId) :to userId :qset qset :score initial-score })
  qset)

(comment def initial-score 
  {
   :categories { :value 0 :problem_solving 0 :self_mgmt 0 :team_work 0 :leadership 0 :communication 0 }
   :value { :business_focused 0 :people_focused 0 :intergity 0 :trustful 0 :authenticity 0 }
   :problem_solving  { :problem_analysis 0 :creative 0 :conceptual_thinking 0  :manage_conflict 0 :negotiation 0 }
   :self_mgmt { :self_learning 0 :efficient 0 :initiative 0 :stress_tolerance 0 :persistence 0 }
   :team_work { :assertive 0 :positive 0 :accept_critics 0 :respectful 0 :facilitation 0 }
   :leadership { :strategic 0 :delegation 0 :coaching 0 :committed 0 :empathy 0 }
   :communication { :listening 0 :presentation 0 :story_telling 0 :written_communication 0 :sociability 0 }
   })

(def initial-score 
  {
   :value 0 :problem_solving 0 :self_mgmt 0 :team_work 0 :leadership 0 :communication 0
   :business_focused 0 :people_focused 0 :intergity 0 :trustful 0 :authenticity 0
   :problem_analysis 0 :creative 0 :conceptual_thinking 0  :manage_conflict 0 :negotiation 0
   :self_learning 0 :efficient 0 :initiative 0 :stress_tolerance 0 :persistence 0
   :assertive 0 :positive 0 :accept_critics 0 :respectful 0 :facilitation 0
   :strategic 0 :delegation 0 :coaching 0 :committed 0 :empathy 0
   :listening 0 :presentation 0 :story_telling 0 :written_communication 0 :sociability 0
   })

(on-client
  (Template.profile.onCreated 
    (fn []
      (def score this.data.myfeedback.score)
      (def my {})
      (def radius 150)
      (def vertices (aget (_.keys framework) :length))
      (def maxvalue (_.max (_.values (_.pick score (_.keys framework)))))
      (def i 0)
      (set! my.categories 
            (_.object (_.map [:self_mgmt :problem_solving :team_work :communication :leadership :value] 
                             (fn [key]
                               (def len (/ (aget score key) maxvalue))
                               (def angle (+ (* Math.PI 0.5) (* i (/ (* 2 Math.PI) vertices))) )
                               (inc i)
                               [key 
                                (+ 
                                     (Math.round (+ radius (* (Math.cos angle) radius len))) 
                                  ","
                                     (Math.round (+ radius (* (Math.sin angle) radius len))))
]
                               ))))
      (set! this.data.my my)
      ))
  
  (comment Template.polygon.onCreated
    (fn []
      (print :polygon this.data)
      ))
  )

(comment defn route-star-data []
  (def score 
    (->
      (_.chain (.fetch (Feedback.find {})))
      (.reduce 
        (fn [score feedback]
          (inc (aget score feedback.category))
          (inc (aget  feedback.skill))
          score) initial-score)
      (.pairs)
      (.map (fn [pair]
              (def values (aget pair 1))
              (def maximum (_.reduce (_.values values)
                                     (fn [maximum val] (Math.max  maximum val)) 3))
              (def result 
                (-> 
                  (_.chain values)
                  (.pairs)
                  (.map (fn [p]
                          (set! (aget p 1) (/ (get p 1) maximum))
                          p
                          ))
                  (.object)
                  (.value)))
              
              (set! (aget pair 1) result)
              pair
              ))
      (.object)
      (.value)))
  (this.render :star { :data { :score score}}))

(publish :feedback [from]
         (def query {:to this.user-id})
         (if from
           (set! query.from from))
         (Feedback.find query))




(comment
  [:invite :quiz]
  [:invite  ]
  [:login :init]
  [:login :quiz]
  [:login :after-quiz]
  [:login :profile]
  [:login :invite]
  [:login :finished]
  )

(on-client
  (route "/script-login"
         (this.layout "ScriptLayout")
         (if (Meteor.user)
           (script-login-route.apply this)
           (this.render :loading)))

  (Template.script-login-init.onCreated 
    (fn []
      (Meteor.call :gen-question-set (Meteor.userId) 
                   (fn [err result]
                     (print :gen-question-set err result)
                     (set-script [ :login :quiz ])
                     )))))

(defn set-script [value]
  (Meteor.users.update (Meteor.userId) { :$set { "profile.script" value}}))


(defn in-script []
  (> (get (get-script) :length) 0))

(on-client
  (Template.registerHelper :inScript (fn [] (in-script))))

(defn get-script []
  (get (get (Meteor.user) :profile) :script))

(comment
  (click :button :.answer)
  "click button, touch button, click .answer, touch .answer")

(defn click [& rest]
  (.join (_.map rest (fn [selector] (+ "click " selector ", touch " selector))) ", "))

(on-client
  (defm-event :scriptLoginAfterQuiz "click button" []
    (set-script [:login :profile]))

  (defm-event :profile "click #finish" []
    (set-script [:login :invite])
    (Router.go "/profile"))

  (defm-event :scriptLoginFinish (click :button) []
    (set-script [])
    (Router.go "/"))

  (defm-event :invite (click :#next) []
    (set-script [:login :finish]))
  )

(defn script-login-route []
  (def script (.-script (.-profile (Meteor.user))))
  (def self this)

  (def phase (or (get script 1) :init))

  (if (== phase :init)
    (this.render :scriptLoginInit))

  (if (== phase :quiz)
    (do
      (Meteor.subscribe :feedback (Meteor.user-id))
      (if (self.ready)
        (if (Feedback.find-one {:from (Meteor.user-id)})
          (self.render :quiz 
                       { :data 
                        { :feedback (Feedback.find-one {:from (Meteor.user-id)})
                         :personId (Meteor.userId)
                         }})
          (self.render :loading))
        (self.render :loading)
        )))

  (if (== phase :profile) 
    (do
      (Meteor.subscribe :feedback (Meteor.user-id))
      (if (and (self.ready) (Feedback.find-one {:from (Meteor.user-id)}))
        (self.render :profile 
                     { :data 
                      { :myfeedback (Feedback.find-one {:from (Meteor.user-id)})
                       :profile (get (Meteor.user) :profile)
                       }})
        (self.render :loading))))

  (if (== phase :after-quiz)
    (this.render :scriptLoginAfterQuiz))

  (if (== phase :invite)
    (this.render :invite))

  (if (== phase :finish)
    (this.render :scriptLoginFinish)))


